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
    getInfo: async () => ({ id, name: id, capabilities: { streaming: true } }),
    subscribeEvents,
  };
}

function waitForEvent() {
  let resolve!: () => void;
  const promise = new Promise<void>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe("provider event hub", () => {
  it("consumes upstream events with zero subscribers", async () => {
    const consumed = waitForEvent();
    const registry = createProviderRegistry({
      providers: [
        provider("one", async function* ({ signal } = {}) {
          consumed.resolve();
          yield {
            type: "session.status",
            providerId: "one",
            sessionId: "one-session",
            status: "idle",
          } as const;
          void signal;
        }),
      ],
    });
    const hub = createProviderEventHub(registry);
    hub.start();
    await consumed.promise;
    await hub.stop();
  });

  it("fans out events and isolates subscriber aborts", async () => {
    const emitted = waitForEvent();
    const registry = createProviderRegistry({
      providers: [
        provider("one", async function* ({ signal } = {}) {
          yield {
            type: "session.status",
            providerId: "one",
            sessionId: "one-session",
            status: "idle",
          } as const;
          emitted.resolve();
          await new Promise<void>((resolve) =>
            signal?.addEventListener("abort", () => resolve(), { once: true }),
          );
        }),
      ],
    });
    const hub = createProviderEventHub(registry);
    const first = hub.subscribeEvents()[Symbol.asyncIterator]();
    const secondAbort = new AbortController();
    const second = hub
      .subscribeEvents({ signal: secondAbort.signal })
      [Symbol.asyncIterator]();

    await first.next();
    await second.next();
    emitted.resolve();
    const firstEvent = first.next();
    const secondEvent = second.next();
    secondAbort.abort();
    await expect(secondEvent).resolves.toMatchObject({ done: true });
    await expect(firstEvent).resolves.toMatchObject({
      value: { type: "session.status", sessionId: "one-session" },
    });
    await hub.stop();
  });

  it("only closes upstream subscriptions during hub shutdown", async () => {
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
    const hub = createProviderEventHub(registry);
    const abort = new AbortController();
    const iterator = hub
      .subscribeEvents({ signal: abort.signal })
      [Symbol.asyncIterator]();
    await iterator.next();
    abort.abort();
    expect(stopped).toBe(false);
    await hub.stop();
    expect(stopped).toBe(true);
  });
});
