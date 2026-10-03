import type { ProviderAdapter } from "@repo/ai-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createProviderEventHub,
  createProviderRegistry,
} from "../../providers";
import { createApp } from "../../server";
import { createTestApp, type AppType } from "../../test-utils";

function fakeProvider(): ProviderAdapter {
  return {
    id: "opencode",
    capabilities: { streaming: true, models: true, agents: true },
    getInfo: async () => ({
      id: "opencode",
      name: "OpenCode",
      capabilities: { streaming: true, models: true, agents: true },
      models: [
        {
          providerId: "opencode",
          modelId: "model-1",
          name: "Model 1",
        },
      ],
      agents: [{ id: "default", name: "Default" }],
    }),
    subscribeEvents: async function* () {
      yield {
        type: "session.status" as const,
        providerId: "opencode",
        sessionId: "session-1",
        status: "idle" as const,
      };
    },
  };
}

let app: AppType;
let close: () => void;
let env: ReturnType<typeof createTestApp>;

beforeEach(() => {
  env = createTestApp();
  env.container.providerRegistry = createProviderRegistry({
    providers: [fakeProvider()],
  });
  env.container.providerEventHub = createProviderEventHub(
    env.container.providerRegistry,
    { onEvent: (event) => env.container.sessionsService.applyEvent(event) },
  );
  app = createApp({ container: env.container });
  close = env.close;
});

afterEach(() => close());

describe("providers integration", () => {
  it("returns a normalized provider catalog", async () => {
    const response = await app.request("/api/providers");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({
        id: "opencode",
        models: [
          expect.objectContaining({
            providerId: "opencode",
            modelId: "model-1",
          }),
        ],
        agents: [expect.objectContaining({ id: "default" })],
      }),
    ]);
  });

  it("streams normalized events from the Cloudy-wide endpoint", async () => {
    const response = await app.request("/api/providers/events");

    expect(response.status).toBe(200);
    await env.container.providerEventHub.stop();
    const body = await response.text();
    expect(body).toContain("event: provider.connection");
    expect(body).toContain('"providerId":"opencode"');
  });
});
