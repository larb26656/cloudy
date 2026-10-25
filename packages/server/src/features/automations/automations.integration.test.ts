import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAgentProviderRegistry } from "../../providers";
import { createApp, type AppType } from "../../server";
import { createTestApp } from "../../test-utils";
import { createAutomationsRepository } from "./automations.repository";
import { createAutomationsService } from "./automations.service";
import { createSessionsRepository } from "../sessions/sessions.repository";
import { createSessionsService } from "../sessions/sessions.service";

let env: ReturnType<typeof createTestApp>;
let app: AppType;
let holdProviderRun = false;
beforeEach(() => {
  env = createTestApp();
  holdProviderRun = false;
  const messages = new Map<
    string,
    {
      id: string;
      sessionId: string;
      role: "assistant";
      parts: { id: string; type: "text"; text: string }[];
      createdAt: string;
    }[]
  >();
  const registry = createAgentProviderRegistry({
    providers: [
      {
        id: "automation-test",
        capabilities: { streaming: false },
        getInfo: async () => ({
          id: "automation-test",
          name: "Test",
          capabilities: { streaming: false },
        }),
        createSession: async (input) => {
          const id = `native-${crypto.randomUUID()}`;
          messages.set(id, []);
          return {
            id,
            providerId: "automation-test",
            status: "idle",
            runStatus: "idle",
            directory: input.directory,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        },
        getSession: async (input) => ({
          id: input.sessionId,
          providerId: "automation-test",
          status: "idle",
          runStatus: "idle",
          directory: input.directory,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        sendMessage: async (input) => {
          if (!holdProviderRun)
            messages.set(input.sessionId, [
              {
                id: crypto.randomUUID(),
                sessionId: input.sessionId,
                role: "assistant",
                parts: [
                  { id: crypto.randomUUID(), type: "text", text: "Completed" },
                ],
                createdAt: new Date().toISOString(),
              },
            ]);
          return { interactionId: crypto.randomUUID(), value: null };
        },
        abortSession: async () => {},
        getSessionStatuses: async () => ({}),
        listMessages: async (input) => ({
          messages: messages.get(input.sessionId) ?? [],
        }),
        subscribeEvents: async function* () {},
      },
    ],
  });
  env.container.agentProviderRegistry = registry;
  env.container.sessionsService = createSessionsService(
    createSessionsRepository(env.db.db),
    registry,
  );
  env.container.automationsService = createAutomationsService(
    createAutomationsRepository(env.db.db),
    registry,
    env.container.sessionsService,
    env.container.workspacesService,
  );
  app = createApp({ container: env.container });
});
afterEach(() => env.close());

describe("automations API", () => {
  it("creates, lists, edits, disables, and returns run history", async () => {
    const createdResponse = await app.request("/api/automations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Daily",
        prompt: "Do work",
        providerInstanceId: "automation-test",
        directoryMode: "temp",
        schedule: { cron: "0 9 * * *", timezone: "UTC", enabled: true },
      }),
    });
    expect(createdResponse.status).toBe(201);
    const automation = await createdResponse.json();
    const update = await app.request(`/api/automations/${automation.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        schedule: { cron: "0 9 * * *", timezone: "UTC", enabled: false },
      }),
    });
    expect((await update.json()).schedule.enabled).toBe(false);
    expect(await (await app.request("/api/automations")).json()).toHaveLength(
      1,
    );
    expect(
      await (
        await app.request(`/api/automations/${automation.id}/runs`)
      ).json(),
    ).toEqual([]);
  });

  it("rejects invalid definitions", async () => {
    const response = await app.request("/api/automations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Daily",
        prompt: "Do work",
        providerInstanceId: "automation-test",
        directoryMode: "specified",
      }),
    });
    expect(response.status).toBe(400);
  });

  it("starts a fresh run and records its output and inspectable session", async () => {
    const created = await app.request("/api/automations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Manual",
        prompt: "Do work",
        providerInstanceId: "automation-test",
        directoryMode: "temp",
      }),
    });
    const automation = await created.json();
    const started = await app.request(
      `/api/automations/${automation.id}/runs`,
      { method: "POST" },
    );
    const run = await started.json();
    await vi.waitFor(async () => {
      const history = await (
        await app.request(`/api/automations/${automation.id}/runs`)
      ).json();
      expect(["succeeded", "failed"]).toContain(history[0].state);
    });
    const history = await (
      await app.request(`/api/automations/${automation.id}/runs`)
    ).json();
    expect(history[0].error).toBeNull();
    expect(history[0]).toMatchObject({
      id: run.id,
      output: "Completed",
      sessionId: expect.any(String),
    });
    const session = await (
      await app.request(`/api/sessions/${history[0].sessionId}`)
    ).json();
    expect(session.origin).toEqual({ type: "automation_run", runId: run.id });
  });

  it("records overlapping attempts as skipped and interrupts a stopped run", async () => {
    holdProviderRun = true;
    const created = await app.request("/api/automations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Waiting",
        prompt: "Do work",
        providerInstanceId: "automation-test",
        directoryMode: "temp",
      }),
    });
    const automation = await created.json();
    const first = await (
      await app.request(`/api/automations/${automation.id}/runs`, {
        method: "POST",
      })
    ).json();
    await vi.waitFor(async () => {
      const history = await (
        await app.request(`/api/automations/${automation.id}/runs`)
      ).json();
      const current = history.find(
        (item: { id: string }) => item.id === first.id,
      );
      expect(current).toMatchObject({
        state: "running",
        sessionId: expect.any(String),
      });
    });
    const skipped = await (
      await app.request(`/api/automations/${automation.id}/runs`, {
        method: "POST",
      })
    ).json();
    expect(skipped.state).toBe("skipped");
    const stopped = await app.request(
      `/api/automations/${automation.id}/runs/${first.id}/stop`,
      { method: "POST" },
    );
    expect((await stopped.json()).state).toBe("interrupted");
  });

  it("records provider removal as a failed run instead of leaving it pending", async () => {
    const created = await app.request("/api/automations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Removed provider",
        prompt: "Do work",
        providerInstanceId: "automation-test",
        directoryMode: "temp",
      }),
    });
    const automation = await created.json();
    env.container.agentProviderRegistry.remove("automation-test");
    const started = await app.request(
      `/api/automations/${automation.id}/runs`,
      { method: "POST" },
    );
    const run = await started.json();
    await vi.waitFor(async () => {
      const current = await (
        await app.request(`/api/automations/${automation.id}/runs/${run.id}`)
      ).json();
      expect(current.state).toBe("failed");
    });
  });
});
