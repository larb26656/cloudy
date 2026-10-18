import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createLLM } from "../../lib/llm-provider";
import { createCloudyAdapter } from "./cloudy.adapter";

function createTestLLM() {
  const llm = createLLM();
  llm.registerProvider("test", {
    configSchema: z.object({}),
    settings: { name: "Test", configFields: [] },
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
      getDefault: () => null,
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
      getDefault: () => null,
    });

    expect((await adapter.getInfo()).models).toEqual([
      { modelId: "test-model", name: "Test model", providerId: "test" },
    ]);
  });

  it("requires a configured default when no model is selected", async () => {
    const adapter = createCloudyAdapter({
      apiProviderRegistry: createTestLLM(),
      getDefault: () => null,
    });
    const session = await adapter.createSession!({});

    await expect(
      adapter.sendMessage!({ sessionId: session.id, content: "Hello" }),
    ).rejects.toThrow("No default LLM connection and model are configured");
  });

  it("uses the selected configured model when sent by the client", async () => {
    let receivedModel: string | undefined;
    const apiProviderRegistry = createTestLLM();
    apiProviderRegistry.registerClient({
      id: "selected-connection",
      type: "test",
      config: {},
      models: [{ modelId: "selected-model", name: "Selected model" }],
    });
    const adapter = createCloudyAdapter({
      apiProviderRegistry,
      getDefault: () => ({
        connectionId: "configured-connection",
        modelId: "configured-model",
      }),
    });
    const client = apiProviderRegistry.getClient("selected-connection");
    if (!client) throw new Error("Expected selected provider client");
    client.chat = async ({ model }) => {
      receivedModel = model;
      return "response";
    };
    const session = await adapter.createSession!({});

    await adapter.sendMessage!({
      sessionId: session.id,
      content: "Hello",
      model: { providerId: "selected-connection", modelId: "selected-model" },
    });

    expect(receivedModel).toBe("selected-model");
  });
});
