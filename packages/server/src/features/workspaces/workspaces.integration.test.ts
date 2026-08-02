import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../../server";
import { createContainer } from "../../container";
import type { CloudyConfig } from "../../config";
import { createTestDb, closeTestDb, type TestDb } from "../../db";

let db: TestDb;

beforeAll(() => {
  db = createTestDb();
});

afterAll(() => {
  closeTestDb(db);
});

function makeConfig(): CloudyConfig {
  return {
    configDir: "/tmp",
    dataDir: "/tmp",
    dbPath: "/tmp/cloudy-test.db",
    ui: false,
    host: "localhost",
    port: 4122,
    cors: [],
    opencodeApiBase: "http://opencode.test",
  };
}

function makeApp() {
  const container = createContainer(makeConfig(), db.db);
  return createApp({ container });
}

describe("workspaces integration", () => {
  it("GET /api/workspaces returns [] on fresh db", async () => {
    const app = makeApp();
    const res = await app.request("/api/workspaces");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("POST creates a workspace and returns 201", async () => {
    const app = makeApp();
    const res = await app.request("/api/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "ws-1",
        name: "Test",
        color: "#3B82F6",
        directory: "/tmp/test-1",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({
      id: "ws-1",
      name: "Test",
      color: "#3B82F6",
      directory: "/tmp/test-1",
    });
    expect(typeof body.createdAt).toBe("string");
  });

  it("POST returns 409 on duplicate directory", async () => {
    const app = makeApp();
    await app.request("/api/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "ws-dup",
        name: "First",
        color: "#3B82F6",
        directory: "/tmp/dup",
      }),
    });
    const res = await app.request("/api/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "ws-dup-2",
        name: "Second",
        color: "#10B981",
        directory: "/tmp/dup",
      }),
    });
    expect(res.status).toBe(409);
  });

  it("GET /:id returns the workspace after create", async () => {
    const app = makeApp();
    await app.request("/api/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "ws-get",
        name: "Get",
        color: "#3B82F6",
        directory: "/tmp/get",
      }),
    });
    const res = await app.request("/api/workspaces/ws-get");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("ws-get");
  });

  it("GET /:id returns 404 when missing", async () => {
    const app = makeApp();
    const res = await app.request("/api/workspaces/nope");
    expect(res.status).toBe(404);
  });

  it("PATCH updates fields", async () => {
    const app = makeApp();
    await app.request("/api/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "ws-patch",
        name: "Old",
        color: "#3B82F6",
        directory: "/tmp/patch",
      }),
    });
    const res = await app.request("/api/workspaces/ws-patch", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "New" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("New");
  });

  it("PATCH returns 404 when missing", async () => {
    const app = makeApp();
    const res = await app.request("/api/workspaces/nope", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "x" }),
    });
    expect(res.status).toBe(404);
  });

  it("DELETE removes the workspace", async () => {
    const app = makeApp();
    await app.request("/api/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "ws-del",
        name: "Del",
        color: "#3B82F6",
        directory: "/tmp/del",
      }),
    });
    const del = await app.request("/api/workspaces/ws-del", { method: "DELETE" });
    expect(del.status).toBe(204);
    const after = await app.request("/api/workspaces/ws-del");
    expect(after.status).toBe(404);
  });

  it("DELETE returns 404 when missing", async () => {
    const app = makeApp();
    const res = await app.request("/api/workspaces/nope", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});
