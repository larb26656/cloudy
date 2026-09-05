import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestApp } from "../../test-utils";

type TestEnv = ReturnType<typeof createTestApp>;

let env: TestEnv;

beforeEach(() => {
  env = createTestApp();
});

afterEach(() => {
  env.close();
});

function postNotification(body: unknown, app: TestEnv["app"]) {
  return app.request("/api/notifications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("notifications integration", () => {
  it("GET /api/notifications returns [] on fresh db", async () => {
    const res = await env.app.request("/api/notifications");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("POST creates a notification and returns 201", async () => {
    const res = await postNotification(
      {
        type: "info",
        title: "Session finished",
        message: "opencode exited",
        metadata: { source: "opencode", sessionID: "s-1" },
      },
      env.app,
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({
      type: "info",
      title: "Session finished",
      message: "opencode exited",
      metadata: { source: "opencode", sessionID: "s-1" },
    });
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(typeof body.createdAt).toBe("string");
  });

  it("POST rejects invalid input with 400", async () => {
    const res = await postNotification(
      { type: "loud", title: "", message: "m" },
      env.app,
    );
    expect(res.status).toBe(400);
  });

  it("GET lists notifications newest first", async () => {
    await postNotification(
      { type: "info", title: "first", message: "m" },
      env.app,
    );
    await postNotification(
      { type: "success", title: "second", message: "m" },
      env.app,
    );
    const res = await env.app.request("/api/notifications");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].title).toBe("second");
    expect(body[1].title).toBe("first");
  });

  it("POST past 30 rows prunes the oldest (kept at 30)", async () => {
    for (let i = 0; i < 31; i++) {
      const res = await postNotification(
        { type: "info", title: `n${i}`, message: "m" },
        env.app,
      );
      expect(res.status).toBe(201);
    }
    const res = await env.app.request("/api/notifications");
    const body = await res.json();
    expect(body).toHaveLength(30);
    expect(body[0].title).toBe("n30");
    expect(body.at(-1).title).toBe("n1");
  });

  it("DELETE /:id removes the notification", async () => {
    const created = await (
      await postNotification(
        { type: "warning", title: "t", message: "m" },
        env.app,
      )
    ).json();
    const del = await env.app.request(`/api/notifications/${created.id}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(204);
    const list = await (await env.app.request("/api/notifications")).json();
    expect(list).toEqual([]);
  });

  it("DELETE /:id returns 404 on unknown id", async () => {
    const res = await env.app.request("/api/notifications/nope", {
      method: "DELETE",
    });
    expect(res.status).toBe(404);
  });

  it("DELETE / clears all notifications", async () => {
    await postNotification({ type: "info", title: "a", message: "m" }, env.app);
    await postNotification(
      { type: "error", title: "b", message: "m" },
      env.app,
    );
    const res = await env.app.request("/api/notifications", {
      method: "DELETE",
    });
    expect(res.status).toBe(204);
    const list = await (await env.app.request("/api/notifications")).json();
    expect(list).toEqual([]);
  });
});
