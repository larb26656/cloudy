import { afterEach, describe, expect, it } from "vitest";
import { createAdaptorServer, type ServerType } from "@hono/node-server";
import { once } from "node:events";
import { WebSocket, WebSocketServer } from "ws";
import { createTestApp } from "../../test-utils";

type TestEnv = ReturnType<typeof createTestApp>;

let env: TestEnv | null = null;
let server: ServerType | null = null;

type Frame = Record<string, unknown>;

/**
 * Test client that collects frames from the moment the socket is created —
 * the server sends its snapshot inside `onOpen`, which can arrive before the
 * client's `open` event is processed, so listeners attached after `open`
 * would race and lose frames.
 */
class FrameCollector {
  readonly socket: WebSocket;
  readonly #frames: Frame[] = [];
  readonly #waiters: ((frame: Frame) => void)[] = [];

  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.socket.on("message", (data) => {
      const frame = JSON.parse(data.toString()) as Frame;
      const waiter = this.#waiters.shift();
      if (waiter) waiter(frame);
      else this.#frames.push(frame);
    });
  }

  opened(): Promise<void> {
    return once(this.socket, "open").then(() => undefined);
  }

  next(): Promise<Frame> {
    const queued = this.#frames.shift();
    if (queued) return Promise.resolve(queued);
    return new Promise((resolve) => this.#waiters.push(resolve));
  }
}

const clients: FrameCollector[] = [];

function makeServer() {
  env = createTestApp();
  server = createAdaptorServer({
    fetch: env.app.fetch,
    websocket: { server: new WebSocketServer({ noServer: true }) },
  });
  return server;
}

async function listen(target: ServerType): Promise<number> {
  await new Promise<void>((resolve) => target.listen(0, "127.0.0.1", resolve));
  const address = target.address();
  if (!address || typeof address === "string") {
    throw new Error("Server did not bind to a TCP port");
  }
  return address.port;
}

async function connect(port: number): Promise<FrameCollector> {
  const client = new FrameCollector(
    `ws://127.0.0.1:${port}/api/notifications/ws`,
  );
  clients.push(client);
  await client.opened();
  return client;
}

async function post(body: unknown, port: number) {
  const res = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

afterEach(async () => {
  for (const client of clients.splice(0)) client.socket.close();
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
    server = null;
  }
  env?.close();
  env = null;
});

describe("notifications WebSocket route", () => {
  it("sends a snapshot on connect", async () => {
    const port = await listen(makeServer());

    const client = await connect(port);
    const frame = await client.next();
    expect(frame).toEqual({ type: "snapshot", notifications: [] });
  });

  it("sends the current feed in the snapshot", async () => {
    const port = await listen(makeServer());
    await post({ type: "info", title: "existing", message: "m" }, port);

    const client = await connect(port);
    const frame = await client.next();
    expect(frame.type).toBe("snapshot");
    const notifications = frame.notifications as { title: string }[];
    expect(notifications).toHaveLength(1);
    expect(notifications[0]!.title).toBe("existing");
  });

  it("pushes notification.created when another client POSTs", async () => {
    const port = await listen(makeServer());
    const client = await connect(port);
    await client.next();

    const created = await post(
      { type: "success", title: "pushed", message: "m" },
      port,
    );
    const frame = await client.next();
    expect(frame.type).toBe("notification.created");
    expect(frame.notification).toEqual(created);
  });

  it("pushes notification.deleted on DELETE and notifications.cleared on clear", async () => {
    const port = await listen(makeServer());
    const client = await connect(port);
    await client.next();
    const first = await post({ type: "info", title: "a", message: "m" }, port);
    await post({ type: "info", title: "b", message: "m" }, port);
    await client.next();
    await client.next();

    const del = await fetch(
      `http://127.0.0.1:${port}/api/notifications/${first.id}`,
      { method: "DELETE" },
    );
    expect(del.status).toBe(204);
    expect(await client.next()).toEqual({
      type: "notification.deleted",
      id: first.id,
    });

    const clear = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
      method: "DELETE",
    });
    expect(clear.status).toBe(204);
    expect(await client.next()).toEqual({ type: "notifications.cleared" });
  });

  it("pushes notification.deleted for pruned rows past the 30 cap", async () => {
    const port = await listen(makeServer());
    const client = await connect(port);
    await client.next();

    for (let i = 0; i < 32; i++) {
      await post({ type: "info", title: `n${i}`, message: "m" }, port);
    }

    const frames: Frame[] = [];
    for (let i = 0; i < 34; i++) frames.push(await client.next());
    const deleted = frames.filter((f) => f.type === "notification.deleted");
    expect(deleted).toHaveLength(2);

    const list = await (
      await fetch(`http://127.0.0.1:${port}/api/notifications`)
    ).json();
    expect(list).toHaveLength(30);
    expect(list.map((n: { title: string }) => n.title)).not.toContain("n0");
    expect(list.map((n: { title: string }) => n.title)).not.toContain("n1");
  });

  it("broadcasts to multiple connected clients", async () => {
    const port = await listen(makeServer());
    const clientA = await connect(port);
    const clientB = await connect(port);
    await clientA.next();
    await clientB.next();

    const created = await post(
      { type: "info", title: "fanout", message: "m" },
      port,
    );
    expect(await clientA.next()).toEqual({
      type: "notification.created",
      notification: created,
    });
    expect(await clientB.next()).toEqual({
      type: "notification.created",
      notification: created,
    });
  });
});
