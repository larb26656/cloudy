import { afterEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { createAdaptorServer, type ServerType } from "@hono/node-server";
import { once } from "node:events";
import { WebSocket, WebSocketServer } from "ws";
import { createApp } from "../../server";
import type { Container } from "../../container";
import type { PtyService } from "./pty.service";

let server: ServerType | null = null;
let socket: WebSocket | null = null;

afterEach(async () => {
  socket?.close();
  socket = null;
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
    server = null;
  }
});

describe("PTY WebSocket route", () => {
  it("upgrades through Hono and pipes data in both directions", async () => {
    const container = mock<Container>();
    const ptyService = mock<PtyService>();
    container.ptyService = ptyService;
    const offData = vi.fn();
    const offExit = vi.fn();
    let emitData: ((data: string) => void) | undefined;

    ptyService.getSession.mockReturnValue({
      id: "pty-1",
      name: "Quiet Harbor",
      directory: "/tmp",
      command: "/bin/sh",
      alive: true,
      exitCode: null,
      createdAt: 100,
      lastActivityAt: 200,
    });
    ptyService.onData.mockImplementation((_id, listener) => {
      emitData = listener;
      return offData;
    });
    ptyService.onExit.mockReturnValue(offExit);

    const app = createApp({ container });
    const webSocketServer = new WebSocketServer({ noServer: true });
    server = createAdaptorServer({
      fetch: app.fetch,
      websocket: { server: webSocketServer },
    });
    const port = await listen(server);

    socket = new WebSocket(
      `ws://127.0.0.1:${port}/api/pty/sessions/pty-1/stream`,
    );
    await once(socket, "open");

    socket.send("pwd\n");
    await vi.waitFor(() => {
      expect(ptyService.write).toHaveBeenCalledWith("pty-1", "pwd\n");
    });

    const message = once(socket, "message");
    emitData?.("/tmp\r\n");
    const [data] = await message;
    expect(data.toString()).toBe("/tmp\r\n");

    socket.close();
    await once(socket, "close");
    await vi.waitFor(() => {
      expect(offData).toHaveBeenCalledOnce();
      expect(offExit).toHaveBeenCalledOnce();
    });
  });
});

async function listen(target: ServerType): Promise<number> {
  await new Promise<void>((resolve) => target.listen(0, "127.0.0.1", resolve));
  const address = target.address();
  if (!address || typeof address === "string") {
    throw new Error("Server did not bind to a TCP port");
  }
  return address.port;
}
