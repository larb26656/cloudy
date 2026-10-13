import { describe, expect, it } from "vitest";
import { createApiProviderRegistry } from "./registry";

describe("createApiProviderRegistry", () => {
  it("lists registered models with their provider IDs", () => {
    const registry = createApiProviderRegistry();
    registry.register(
      "deepinfra",
      {
        chat: async () => "response",
        chatAsync: async function* () {},
      },
      [{ modelId: "google/gemma-3-12b-it", name: "Gemma 3 12B" }],
    );

    expect(registry.listModels()).toEqual([
      {
        providerId: "deepinfra",
        modelId: "google/gemma-3-12b-it",
        name: "Gemma 3 12B",
      },
    ]);
  });

  it("removes a provider and its models", () => {
    const registry = createApiProviderRegistry();
    registry.register(
      "deepinfra",
      {
        chat: async () => "response",
        chatAsync: async function* () {},
      },
      [{ modelId: "model", name: "Model" }],
    );

    expect(registry.deleteById("deepinfra")).toBe(true);
    expect(registry.listModels()).toEqual([]);
  });
});
