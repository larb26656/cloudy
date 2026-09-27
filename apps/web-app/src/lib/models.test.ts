import { describe, expect, it } from "vitest";
import { toModelInfo } from "./models";

describe("toModelInfo", () => {
  it("maps the legacy providerID/modelID shape to ModelInfo", () => {
    expect(
      toModelInfo({
        providerID: "openai",
        modelID: "gpt-5",
        name: "GPT-5",
        description: "flagship",
        maxTokens: 128_000,
        supportsStreaming: true,
        supportsTools: false,
      }),
    ).toEqual({
      providerId: "openai",
      modelId: "gpt-5",
      name: "GPT-5",
      description: "flagship",
      capabilities: {
        streaming: true,
        tools: false,
        maxInputTokens: 128_000,
      },
    });
  });

  it("passes through an already-normalized ModelInfo", () => {
    const model = {
      providerId: "opencode",
      modelId: "gpt-5",
      name: "GPT-5",
      capabilities: { streaming: true, tools: true },
    };

    expect(toModelInfo(model)).toEqual(model);
  });

  it("falls back to the model id as the display name", () => {
    expect(toModelInfo({ providerID: "openai", modelID: "gpt-5" })).toEqual({
      providerId: "openai",
      modelId: "gpt-5",
      name: "gpt-5",
    });
  });

  it("returns null for nullish values and entries without identity", () => {
    expect(toModelInfo(null)).toBeNull();
    expect(toModelInfo(undefined)).toBeNull();
    expect(toModelInfo("gpt-5")).toBeNull();
    expect(toModelInfo({ name: "GPT-5" })).toBeNull();
    expect(toModelInfo({ providerID: "openai" })).toBeNull();
  });
});
