import type { ChatEvent, ProviderEventsInput } from "@repo/ai-core";
import type { ProviderRegistry } from "./provider.registry";

export interface ProviderEventSubscriptionInput extends ProviderEventsInput {
  providerId?: string;
}

export interface ProviderEventHub {
  start(): void;
  stop(): Promise<void>;
  subscribeEvents(
    input?: ProviderEventSubscriptionInput,
  ): AsyncIterable<ChatEvent>;
}

interface PendingEvent {
  providerId: string;
  iterator: AsyncIterator<ChatEvent>;
  promise: Promise<IteratorResult<ChatEvent>>;
}

interface Subscriber {
  input: ProviderEventSubscriptionInput;
  values: ChatEvent[];
  pending: Array<(result: IteratorResult<ChatEvent>) => void>;
  closed: boolean;
}

const MAX_BUFFERED_EVENTS = 256;

export function createProviderEventHub(
  registry: ProviderRegistry,
  options: {
    onEvent?: (
      event: ChatEvent,
    ) => ChatEvent | null | Promise<ChatEvent | null>;
  } = {},
): ProviderEventHub {
  const controller = new AbortController();
  const subscribers = new Set<Subscriber>();
  let producer: Promise<void> | null = null;

  const publish = (event: ChatEvent) => {
    for (const subscriber of subscribers) {
      if (subscriber.closed || !matches(subscriber.input, event)) continue;
      const resolve = subscriber.pending.shift();
      if (resolve) resolve({ done: false, value: event });
      else {
        subscriber.values.push(event);
        if (subscriber.values.length > MAX_BUFFERED_EVENTS)
          subscriber.values.shift();
      }
    }
  };

  const start = () => {
    if (producer) return;
    producer = runProducer().finally(() => {
      producer = null;
    });
  };

  const stop = async () => {
    controller.abort();
    await producer;
    for (const subscriber of subscribers) closeSubscriber(subscriber);
    subscribers.clear();
  };

  const subscribeEvents = (
    input: ProviderEventSubscriptionInput = {},
  ): AsyncIterable<ChatEvent> => {
    const subscriber: Subscriber = {
      input,
      values: [],
      pending: [],
      closed: false,
    };
    subscribers.add(subscriber);
    const abort = () => {
      closeSubscriber(subscriber);
      subscribers.delete(subscriber);
    };
    input.signal?.addEventListener("abort", abort, { once: true });
    start();

    return {
      [Symbol.asyncIterator]() {
        return {
          next: () => {
            if (subscriber.closed)
              return Promise.resolve({ done: true, value: undefined });
            const value = subscriber.values.shift();
            if (value) return Promise.resolve({ done: false, value });
            return new Promise<IteratorResult<ChatEvent>>((resolve) => {
              subscriber.pending.push(resolve);
            });
          },
          return: () => {
            closeSubscriber(subscriber);
            subscribers.delete(subscriber);
            input.signal?.removeEventListener("abort", abort);
            return Promise.resolve({ done: true, value: undefined });
          },
          [Symbol.asyncIterator]() {
            return this;
          },
        };
      },
    };
  };

  async function runProducer() {
    const pending: PendingEvent[] = [];
    try {
      for (const provider of registry.list()) {
        let iterator: AsyncIterator<ChatEvent>;
        try {
          iterator = provider
            .subscribeEvents({ signal: controller.signal })
            [Symbol.asyncIterator]();
        } catch (error) {
          publish(connectionEvent(provider.id, "disconnected", error));
          continue;
        }
        publish(connectionEvent(provider.id, "connected"));
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
          publish(
            connectionEvent(
              result.entry.providerId,
              "disconnected",
              result.error,
            ),
          );
          continue;
        }
        if (result.value.done) {
          pending.splice(index, 1);
          publish(connectionEvent(result.entry.providerId, "disconnected"));
          continue;
        }
        const event = {
          ...result.value.value,
          providerId: result.entry.providerId,
        };
        const mapped = options.onEvent ? await options.onEvent(event) : event;
        if (mapped) publish(mapped);
        result.entry.promise = result.entry.iterator.next();
      }
    } finally {
      await Promise.allSettled(
        pending.map((entry) => entry.iterator.return?.(undefined)),
      );
    }
  }

  function closeSubscriber(subscriber: Subscriber) {
    if (subscriber.closed) return;
    subscriber.closed = true;
    for (const resolve of subscriber.pending.splice(0))
      resolve({ done: true, value: undefined });
  }

  return { start, stop, subscribeEvents };
}

function matches(input: ProviderEventSubscriptionInput, event: ChatEvent) {
  if (input.providerId && event.providerId !== input.providerId) return false;
  if (input.directory && event.directory !== input.directory) return false;
  if (
    input.sessionId &&
    (!("sessionId" in event) || event.sessionId !== input.sessionId)
  )
    return false;
  return true;
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
