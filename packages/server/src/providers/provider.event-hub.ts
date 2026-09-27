import type { ChatEvent, ProviderEventsInput } from "@repo/ai-core";
import type { ProviderRegistry } from "./provider.registry";

type EventIterator = AsyncIterator<ChatEvent>;

interface PendingEvent {
  providerId: string;
  iterator: EventIterator;
  promise: Promise<IteratorResult<ChatEvent>>;
}

export function createProviderEventHub(registry: ProviderRegistry) {
  return {
    subscribeEvents(input: ProviderEventsInput = {}): AsyncIterable<ChatEvent> {
      return mergeProviderEvents(registry, input);
    },
  };
}

async function* mergeProviderEvents(
  registry: ProviderRegistry,
  input: ProviderEventsInput,
): AsyncGenerator<ChatEvent> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  input.signal?.addEventListener("abort", abort, { once: true });
  const pending: PendingEvent[] = [];

  try {
    for (const provider of registry.list()) {
      let iterator: EventIterator;
      try {
        iterator = provider
          .subscribeEvents({ ...input, signal: controller.signal })
          [Symbol.asyncIterator]();
      } catch (error) {
        yield connectionEvent(provider.id, "disconnected", error);
        continue;
      }

      yield connectionEvent(provider.id, "connected");
      pending.push({
        providerId: provider.id,
        iterator,
        promise: iterator.next(),
      });
    }

    while (pending.length > 0 && !controller.signal.aborted) {
      const result = await Promise.race(
        pending.map((entry) =>
          entry.promise.then(
            (value) => ({ entry, value }),
            (error: unknown) => ({ entry, error }),
          ),
        ),
      );
      const index = pending.indexOf(result.entry);
      if (index < 0) continue;

      if ("error" in result) {
        pending.splice(index, 1);
        yield connectionEvent(
          result.entry.providerId,
          "disconnected",
          result.error,
        );
        continue;
      }

      if (result.value.done) {
        pending.splice(index, 1);
        yield connectionEvent(result.entry.providerId, "disconnected");
        continue;
      }

      yield { ...result.value.value, providerId: result.entry.providerId };
      result.entry.promise = result.entry.iterator.next();
    }
  } finally {
    input.signal?.removeEventListener("abort", abort);
    controller.abort();
    await Promise.allSettled(
      pending.map((entry) => entry.iterator.return?.(undefined)),
    );
  }
}

function connectionEvent(
  providerId: string,
  state: "connected" | "disconnected",
  error?: unknown,
): ChatEvent {
  return {
    type: "provider.connection",
    providerId,
    state,
    ...(error === undefined ? {} : { error }),
  };
}
