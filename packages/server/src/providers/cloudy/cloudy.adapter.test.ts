import { describe, expect, it } from "vitest";
import { createApiProviderRegistry } from "../../ai-provider/registry";
import { createCloudyAdapter } from "./cloudy.adapter";

describe("createCloudyAdapter", () => {
  it("does not require a directory", async () => {
    const adapter = createCloudyAdapter({
      apiProviderRegistry: createApiProviderRegistry(),
      defaultApiProviderId: "test",
      defaultModel: "test-model",
    });

    expect((await adapter.getInfo()).capabilities.requiresDirectory).toBe(
      false,
    );
  });

  it("exposes registered API provider models", async () => {
    const apiProviderRegistry = createApiProviderRegistry();
    apiProviderRegistry.register(
      "test",
      {
        chat: async () => "",
        chatAsync: async function* () {},
      },
      [{ modelId: "test-model", name: "Test model" }],
    );
    const adapter = createCloudyAdapter({
      apiProviderRegistry,
      defaultApiProviderId: "test",
      defaultModel: "test-model",
    });

    expect((await adapter.getInfo()).models).toEqual([
      { modelId: "test-model", name: "Test model", providerId: "test" },
    ]);
  });
});
