import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createLLM } from "./create-llm";
import { LLMProviderConflictError, LLMProviderNotFoundError } from "./errors";

const definition = {
  configSchema: z.object({ apiKey: z.string().min(1) }),
  settings: {
    name: "Test",
    configFields: [
      {
        key: "apiKey",
        label: "API key",
        type: "secret" as const,
        required: true,
      },
    ],
  },
  create: vi.fn(() => ({
    chat: vi.fn(
      async ({ message }: { message: string }) => `reply: ${message}`,
    ),
    chatAsync: async function* ({ message }: { message: string }) {
      yield { text: message };
    },
  })),
};

describe("createLLM", () => {
  it("registers providers and creates clients with provider-scoped models", async () => {
    const llm = createLLM();
    llm.registerProvider("test", definition);

    const client = llm.registerClient({
      id: "client-1",
      type: "test",
      config: { apiKey: "secret" },
      models: [{ modelId: "model-1", name: "Model 1" }],
    });

    expect(client).toMatchObject({
      id: "client-1",
      providerType: "test",
      models: [{ modelId: "model-1", name: "Model 1", providerId: "client-1" }],
    });
    expect(llm.getClient("client-1")).toBe(client);
    expect(llm.listClients()).toEqual([client]);
    expect(llm.listProviders()).toEqual(["test"]);
    expect(llm.listProviderTypes()).toEqual([
      {
        id: "test",
        name: "Test",
        configFields: definition.settings.configFields,
      },
    ]);
    expect(llm.listModels()).toEqual(client.models);
    await expect(
      client.chat({ model: "model-1", message: "hello" }),
    ).resolves.toBe("reply: hello");
    expect(definition.create).toHaveBeenCalledWith({ apiKey: "secret" });
  });

  it("rejects duplicate provider types and unknown provider types", () => {
    const llm = createLLM();
    llm.registerProvider("test", definition);

    expect(() => llm.registerProvider("test", definition)).toThrow(
      LLMProviderConflictError,
    );
    expect(() =>
      llm.registerClient({
        id: "client-1",
        type: "missing",
        config: {},
        models: [],
      }),
    ).toThrow(LLMProviderNotFoundError);
  });

  it("validates config before creating a client and rejects duplicate client IDs", () => {
    const llm = createLLM();
    llm.registerProvider("test", definition);

    expect(() =>
      llm.registerClient({
        id: "invalid",
        type: "test",
        config: {},
        models: [],
      }),
    ).toThrow();

    llm.registerClient({
      id: "client-1",
      type: "test",
      config: { apiKey: "secret" },
      models: [],
    });
    expect(() =>
      llm.registerClient({
        id: "client-1",
        type: "test",
        config: { apiKey: "secret" },
        models: [],
      }),
    ).toThrow(LLMProviderConflictError);
  });

  it("deletes clients and returns false for missing IDs", () => {
    const llm = createLLM();
    llm.registerProvider("test", definition);
    llm.registerClient({
      id: "client-1",
      type: "test",
      config: { apiKey: "secret" },
      models: [],
    });

    expect(llm.deleteClient("client-1")).toBe(true);
    expect(llm.getClient("client-1")).toBeUndefined();
    expect(llm.listClients()).toEqual([]);
    expect(llm.deleteClient("missing")).toBe(false);
  });
});
