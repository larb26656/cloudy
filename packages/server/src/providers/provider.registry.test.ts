import type { AgentProviderAdapter, ChatEvent } from "@repo/ai-core";
import { describe, expect, it } from "vitest";
import {
  ProviderNotFoundError,
  UnsupportedProviderOperationError,
} from "./provider.errors";
import { createAgentProviderRegistry } from "./provider.registry";
import { ConflictError, ValidationError } from "../shared/domain-error";

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
    expect(await registry.catalog()).toEqual({
      providers: [
        expect.objectContaining({
          id: "test",
          capabilities: {
            streaming: true,
            requiresDirectory: false,
            approvals: false,
            questions: false,
            fileMentions: false,
            commands: false,
            attachments: false,
            tools: false,
            reasoning: false,
            models: false,
            agents: false,
          },
        }),
      ],
      errors: [],
    });
  });

  it("preserves explicitly configured capabilities", async () => {
    const registry = createAgentProviderRegistry({
      providers: [
        provider({
          getInfo: async () => ({
            id: "test",
            name: "Test",
            capabilities: { streaming: true, approvals: true },
          }),
        }),
      ],
    });

    const { providers } = await registry.catalog();
    const [catalogProvider] = providers;

    expect(catalogProvider?.capabilities.approvals).toBe(true);
    expect(catalogProvider?.capabilities.questions).toBe(false);
  });

  it("returns successful providers when another provider fails", async () => {
    const registry = createAgentProviderRegistry({
      providers: [
        provider(),
        provider({
          id: "broken",
          getInfo: async () => {
            throw new Error("Provider unavailable");
          },
        }),
      ],
    });

    await expect(registry.catalog()).resolves.toEqual({
      providers: [expect.objectContaining({ id: "test" })],
      errors: [{ providerId: "broken", message: "Provider unavailable" }],
    });
  });

  it("rejects unknown providers", () => {
    const registry = createAgentProviderRegistry({ providers: [provider()] });

    expect(() => registry.get("missing")).toThrow(ProviderNotFoundError);
  });

  it("rejects duplicate provider IDs", () => {
    expect(() =>
      createAgentProviderRegistry({ providers: [provider(), provider()] }),
    ).toThrow(ValidationError);
  });

  it("rejects registering an existing provider as a conflict", () => {
    const registry = createAgentProviderRegistry({ providers: [provider()] });

    expect(() => registry.register(provider())).toThrow(ConflictError);
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
