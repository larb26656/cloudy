import type { ChatEvent, ProviderAdapter } from "@repo/ai-core";
import { describe, expect, it } from "vitest";
import {
  ProviderNotFoundError,
  UnsupportedProviderOperationError,
} from "./provider.errors";
import { createProviderRegistry } from "./provider.registry";

function provider(overrides: Partial<ProviderAdapter> = {}): ProviderAdapter {
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
        sessionId: "session",
        status: "idle",
      };
    },
    ...overrides,
  };
}

describe("provider registry", () => {
  it("looks up providers and returns a catalog", async () => {
    const registry = createProviderRegistry({ providers: [provider()] });

    expect(registry.get("test").id).toBe("test");
    expect(await registry.catalog()).toEqual([
      expect.objectContaining({ id: "test" }),
    ]);
  });

  it("rejects unknown providers", () => {
    const registry = createProviderRegistry({ providers: [provider()] });

    expect(() => registry.get("missing")).toThrow(ProviderNotFoundError);
  });

  it("rejects duplicate provider IDs", () => {
    expect(() =>
      createProviderRegistry({ providers: [provider(), provider()] }),
    ).toThrow("Provider IDs must be unique");
  });

  it("reports unsupported operations", () => {
    const registry = createProviderRegistry({ providers: [provider()] });

    expect(() =>
      registry.sendMessage("test", {
        sessionId: "session",
        content: "hello",
      }),
    ).toThrow(UnsupportedProviderOperationError);
  });
});
