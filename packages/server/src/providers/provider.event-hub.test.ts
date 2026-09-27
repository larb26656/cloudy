import type { ProviderAdapter } from "@repo/ai-core";
import { describe, expect, it } from "vitest";
import { createProviderEventHub } from "./provider.event-hub";
import { createProviderRegistry } from "./provider.registry";

function provider(
  id: string,
  subscribeEvents: ProviderAdapter["subscribeEvents"],
): ProviderAdapter {
  return {
    id,
    capabilities: { streaming: true },
    getInfo: async () => ({
      id,
      name: id,
      capabilities: { streaming: true },
    }),
    subscribeEvents,
  };
}

async function collect(iterable: AsyncIterable<unknown>) {
  const events: unknown[] = [];
  for await (const event of iterable) events.push(event);
  return events;
}

describe("provider event hub", () => {
  it("multiplexes normalized events and preserves their provider IDs", async () => {
    const registry = createProviderRegistry({
      providers: [
        provider("one", async function* () {
          yield {
            type: "session.status",
            providerId: "one",
            sessionId: "one-session",
            status: "idle",
          } as const;
        }),
        provider("two", async function* () {
          yield {
            type: "session.status",
            providerId: "two",
            sessionId: "two-session",
            status: "idle",
          } as const;
        }),
      ],
    });

    const events = await collect(
      createProviderEventHub(registry).subscribeEvents(),
    );

    expect(events).toEqual([
      { type: "provider.connection", providerId: "one", state: "connected" },
      { type: "provider.connection", providerId: "two", state: "connected" },
      expect.objectContaining({ providerId: "one", sessionId: "one-session" }),
      { type: "provider.connection", providerId: "one", state: "disconnected" },
      expect.objectContaining({ providerId: "two", sessionId: "two-session" }),
      { type: "provider.connection", providerId: "two", state: "disconnected" },
    ]);
  });

  it("isolates a provider failure from other subscriptions", async () => {
    const registry = createProviderRegistry({
      providers: [
        provider("failed", async function* () {
          throw new Error("provider offline");
          yield* [];
        }),
        provider("healthy", async function* () {
          yield {
            type: "session.status",
            providerId: "healthy",
            sessionId: "session",
            status: "idle",
          } as const;
        }),
      ],
    });

    const events = await collect(
      createProviderEventHub(registry).subscribeEvents(),
    );

    expect(events).toContainEqual({
      type: "provider.connection",
      providerId: "failed",
      state: "disconnected",
      error: expect.any(Error),
    });
    expect(events).toContainEqual(
      expect.objectContaining({ providerId: "healthy", sessionId: "session" }),
    );
  });

  it("stops upstream subscriptions when the consumer aborts", async () => {
    let stopped = false;
    const registry = createProviderRegistry({
      providers: [
        provider("one", async function* ({ signal } = {}) {
          try {
            await new Promise<void>((resolve) =>
              signal?.addEventListener("abort", () => resolve(), {
                once: true,
              }),
            );
          } finally {
            stopped = true;
          }
          yield* [];
        }),
      ],
    });
    const abort = new AbortController();
    const iterator = createProviderEventHub(registry)
      .subscribeEvents({ signal: abort.signal })
      [Symbol.asyncIterator]();

    await iterator.next();
    const pending = iterator.next();
    abort.abort();
    await pending;

    expect(stopped).toBe(true);
  });
});
