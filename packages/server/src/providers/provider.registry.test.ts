import type { AgentProviderAdapter, ChatEvent } from "@repo/ai-core";
import { describe, expect, it } from "vitest";
import {
  ProviderNotFoundError,
  UnsupportedProviderOperationError,
} from "./provider.errors";
import { createAgentProviderRegistry } from "./provider.registry";

function provider(
  overrides: Partial<AgentProviderAdapter> = {},
): AgentProviderAdapter {
  return {
    id: "test",
    capabilities: { streaming: true },
    getInfo: async () => ({
      id: "test",
      name: "Test",
      capabilities: { streaming: true },
    }),
    subscribeEvents: async function* (): AsyncIterable<ChatEvent> {
      yield {
        type: "session.status",
        providerId: "test",
        sessionId: "session",
        status: "idle",
      };
    },
    ...overrides,
  };
}

describe("provider registry", () => {
  it("looks up providers and returns a catalog", async () => {
    const registry = createAgentProviderRegistry({ providers: [provider()] });

    expect(registry.get("test").id).toBe("test");
    expect(await registry.catalog()).toEqual([
      expect.objectContaining({ id: "test" }),
    ]);
  });

  it("rejects unknown providers", () => {
    const registry = createAgentProviderRegistry({ providers: [provider()] });

    expect(() => registry.get("missing")).toThrow(ProviderNotFoundError);
  });

  it("rejects duplicate provider IDs", () => {
    expect(() =>
      createAgentProviderRegistry({ providers: [provider(), provider()] }),
    ).toThrow("Provider IDs must be unique");
  });

  it("reports unsupported operations", () => {
    const registry = createAgentProviderRegistry({ providers: [provider()] });

    expect(() =>
      registry.sendMessage("test", {
        sessionId: "session",
        content: "hello",
      }),
    ).toThrow(UnsupportedProviderOperationError);
  });
});
