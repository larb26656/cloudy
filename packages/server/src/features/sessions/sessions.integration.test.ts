import type { ChatSession, ProviderAdapter } from "@repo/ai-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProviderRegistry } from "../../providers";
import { createApp, type AppType } from "../../server";
import { createTestApp } from "../../test-utils";
import { createSessionsRepository } from "./sessions.repository";
import { createSessionsService } from "./sessions.service";

function session(id: string, directory?: string): ChatSession {
  return {
    id,
    providerId: "test",
    status: "idle",
    runStatus: "idle",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    directory,
  };
}

function provider(
  executeCommand?: ProviderAdapter["executeCommand"],
): ProviderAdapter {
  let next = 0;
  return {
    id: "test",
    capabilities: { streaming: true },
    getInfo: async () => ({
      id: "test",
      name: "Test",
      capabilities: { streaming: true },
    }),
    createSession: async (input) =>
      session(`native-${++next}`, input.directory),
    getSession: async (input) => session(input.sessionId, input.directory),
    getSessionStatuses: async () => ({ "native-1": "running" }),
    executeCommand,
    listMessages: async (input) => ({
      messages: [
        {
          id: "message-1",
          sessionId: input.sessionId,
          role: "assistant",
          parts: [],
          createdAt: new Date().toISOString(),
        },
      ],
    }),
    subscribeEvents: async function* () {},
  };
}

let env: ReturnType<typeof createTestApp>;
let app: AppType;
const executeCommand = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  env = createTestApp();
  executeCommand.mockClear();
  const registry = createProviderRegistry({
    providers: [provider(executeCommand)],
  });
  env.container.providerRegistry = registry;
  env.container.sessionsService = createSessionsService(
    createSessionsRepository(env.db.db),
    registry,
  );
  app = createApp({ container: env.container });
});

afterEach(() => env.close());

describe("sessions integration", () => {
  it("creates and lists Cloudy-owned sessions", async () => {
    const created = await app.request("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerId: "test", directory: "/tmp/project" }),
    });

    expect(created.status).toBe(201);
    const session = await created.json();
    expect(session).toMatchObject({
      providerId: "test",
      directory: "/tmp/project",
    });
    expect(session.id).toMatch(/^[0-9a-f-]{36}$/);

    const listed = await app.request("/api/sessions?limit=8");
    expect(listed.status).toBe(200);
    expect(await listed.json()).toEqual([
      expect.objectContaining({ id: session.id, providerId: "test" }),
    ]);
  });

  it("resolves central messages and status through its provider binding", async () => {
    const created = await app.request("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerId: "test" }),
    });
    const { id } = await created.json();

    const status = await app.request(`/api/sessions/${id}/status`);
    expect(await status.json()).toBe("running");

    const messages = await app.request(`/api/sessions/${id}/messages`);
    expect(await messages.json()).toMatchObject({
      messages: [expect.objectContaining({ sessionId: id })],
    });
  });

  it("executes commands against the native provider session ID", async () => {
    const created = await app.request("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerId: "test", directory: "/tmp/project" }),
    });
    const { id } = await created.json();

    const response = await app.request(`/api/sessions/${id}/command`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ command: "push", arguments: "" }),
    });

    expect(response.status).toBe(204);
    expect(executeCommand).toHaveBeenCalledWith({
      sessionId: "native-1",
      command: "push",
      arguments: "",
      directory: "/tmp/project",
    });
  });

  it("routes permission interactions through the Cloudy session", async () => {
    const listPermissions = vi.fn().mockResolvedValue([
      {
        id: "permission-1",
        sessionId: "native-1",
        permission: "bash",
        patterns: ["git *"],
      },
    ]);
    const respondToInteraction = vi.fn().mockResolvedValue({
      interactionId: "permission-1",
      value: null,
    });
    const registry = createProviderRegistry({
      providers: [
        {
          ...provider(executeCommand),
          listPermissions,
          respondToInteraction,
        },
      ],
    });
    env.container.providerRegistry = registry;
    env.container.sessionsService = createSessionsService(
      createSessionsRepository(env.db.db),
      registry,
    );
    app = createApp({ container: env.container });

    const created = await app.request("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerId: "test", directory: "/tmp/project" }),
    });
    const { id } = await created.json();

    const listed = await app.request(`/api/sessions/${id}/permissions`);
    expect(listed.status).toBe(200);
    expect(await listed.json()).toEqual([
      expect.objectContaining({ id: "permission-1", sessionId: id }),
    ]);

    const response = await app.request(
      `/api/sessions/${id}/permissions/permission-1`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reply: "once" }),
      },
    );

    expect(response.status).toBe(200);
    expect(respondToInteraction).toHaveBeenCalledWith({
      kind: "permission",
      sessionId: "native-1",
      interactionId: "permission-1",
      directory: "/tmp/project",
      value: { reply: "once", directory: "/tmp/project" },
    });
  });

  it("returns 404 for unknown Cloudy session IDs", async () => {
    const response = await app.request(
      "/api/sessions/00000000-0000-4000-8000-000000000000",
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Session not found: 00000000-0000-4000-8000-000000000000",
    });
  });
});
