import type { ProviderAdapter } from "@repo/ai-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createProviderRegistry } from "../../providers";
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

beforeEach(() => {
  const env = createTestApp();
  env.container.providerRegistry = createProviderRegistry({
    providers: [fakeProvider()],
  });
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

  it("streams normalized events as SSE", async () => {
    const response = await app.request("/api/providers/opencode/events");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const body = await response.text();
    expect(body).toContain("event: connected");
    expect(body).toContain('"type":"session.status"');
  });

  it("streams provider-scoped events from the Cloudy-wide endpoint", async () => {
    const response = await app.request("/api/providers/events");

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("event: provider.connection");
    expect(body).toContain('"providerId":"opencode"');
  });

  it("returns 404 for an unknown provider", async () => {
    const response = await app.request("/api/providers/missing/events");

    expect(response.status).toBe(404);
  });
});
