import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createLLM } from "../../lib/llm-provider";
import { createCloudyAdapter } from "./cloudy.adapter";

function createTestLLM() {
  const llm = createLLM();
  llm.registerProvider("test", {
    configSchema: z.object({}),
    create: () => ({
      chat: async () => "",
      chatAsync: async function* () {},
    }),
  });
  return llm;
}

describe("createCloudyAdapter", () => {
  it("does not require a directory", async () => {
    const adapter = createCloudyAdapter({
      apiProviderRegistry: createTestLLM(),
      defaultApiProviderId: "test",
      defaultModel: "test-model",
    });

    expect((await adapter.getInfo()).capabilities.requiresDirectory).toBe(
      false,
    );
  });

  it("exposes registered API provider models", async () => {
    const apiProviderRegistry = createTestLLM();
    apiProviderRegistry.registerClient({
      id: "test",
      type: "test",
      config: {},
      models: [{ modelId: "test-model", name: "Test model" }],
    });
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
