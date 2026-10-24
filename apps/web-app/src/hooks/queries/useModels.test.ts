import { beforeEach, describe, expect, test, vi } from "vitest";
import type { AgentProviderInfo } from "@repo/contracts";
import { fetchAgentProviderCatalog } from "./useModels";

const mocks = vi.hoisted(() => ({ $get: vi.fn() }));

vi.mock("@/lib/api", () => ({
  cloudyClient: {
    api: {
      "agent-providers": { $get: mocks.$get },
    },
  },
}));

const catalog: AgentProviderInfo[] = [
  {
    id: "opencode",
    name: "OpenCode",
    capabilities: { streaming: true, models: true },
    models: [
      {
        providerId: "opencode",
        modelId: "gpt-5",
        name: "GPT-5",
        capabilities: { streaming: true, tools: true },
        metadata: { upstreamProviderId: "openai" },
      },
    ],
  },
];

describe("fetchAgentProviderCatalog", () => {
  beforeEach(() => {
    mocks.$get.mockReset();
  });

  test("returns the normalized provider catalog", async () => {
    mocks.$get.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ providers: catalog, errors: [] }),
    });

    await expect(fetchAgentProviderCatalog()).resolves.toEqual(catalog);
    expect(mocks.$get).toHaveBeenCalledTimes(1);
  });

  test("throws an error carrying the HTTP status when the request fails", async () => {
    mocks.$get.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({}),
    });

    await expect(fetchAgentProviderCatalog()).rejects.toThrow(
      "Failed to load model catalog (502)",
    );
  });
});
