import type { GlobalEvent } from "@opencode-ai/sdk/v2";
import { getOcClient } from "./opencode/oc-instance";

export type GlobalEventCallback = (event: GlobalEvent) => void;
export type StatusCallback = (status: "connecting" | "connected" | "disconnected" | "error", error?: Error) => void;

type Subscriber = {
  onEvent: GlobalEventCallback;
  onStatus?: StatusCallback;
};

const subscribers = new Set<Subscriber>();
let stream: AsyncGenerator<GlobalEvent> | null = null;
let connectionTask: AbortController | null = null;
let isConnecting = false;

const DEBUG_KEY = "debug:globalEventBus";

function isDebugEnabled(): boolean {
  return localStorage.getItem(DEBUG_KEY) === "true";
}

function log(...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.group("[GlobalEventBus]");
    console.debug(...args);
    console.groupEnd();
  }
}

function notifyStatus(status: "connecting" | "connected" | "disconnected" | "error", error?: Error): void {
  for (const subscriber of subscribers) {
    subscriber.onStatus?.(status, error);
  }
}

async function startConnection(): Promise<void> {
  if (isConnecting || stream) return;

  isConnecting = true;
  notifyStatus("connecting");

  const oc = getOcClient();

  try {
    const result = await oc.global.event();
    stream = result.stream;
    isConnecting = false;
    notifyStatus("connected");
    log("SSE connection established");

    (async () => {
      try {
        for await (const event of stream!) {
          log("event:", event.payload.type);
          for (const subscriber of subscribers) {
            subscriber.onEvent(event);
          }
        }
      } catch (error) {
        log("Stream ended or error:", error);
      } finally {
        stream = null;
        if (subscribers.size > 0) {
          notifyStatus("disconnected");
        }
      }
    })();
  } catch (error) {
    isConnecting = false;
    stream = null;
    notifyStatus("error", error instanceof Error ? error : new Error(String(error)));
    log("Failed to start SSE connection:", error);
  }
}

function stopConnection(): void {
  if (connectionTask) {
    connectionTask.abort();
    connectionTask = null;
  }
  stream = null;
  isConnecting = false;
}

export function subscribe(callback: GlobalEventCallback, onStatus?: StatusCallback): () => void {
  const subscriber: Subscriber = { onEvent: callback, onStatus };
  subscribers.add(subscriber);
  log("subscribed, total:", subscribers.size);

  if (subscribers.size === 1) {
    startConnection();
  } else if (isConnecting) {
    onStatus?.("connecting");
  } else if (stream) {
    onStatus?.("connected");
  }

  return () => {
    subscribers.delete(subscriber);
    log("unsubscribed, total:", subscribers.size);

    if (subscribers.size === 0) {
      stopConnection();
      notifyStatus("disconnected");
    }
  };
}
