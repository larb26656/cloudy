import { type GlobalEvent } from "@opencode-ai/sdk/v2/client";
import {
  applyChatEvent,
  toChatEvent,
  useStreamingMessagesStore,
  type MessageStreamState,
} from "@repo/opencode";
import { createClient } from "./client";

export type StreamState = MessageStreamState;

export async function subscribeToEvents(
  directory: string,
  onEvent: (event: GlobalEvent) => void,
  isCancelled: () => boolean,
): Promise<() => void> {
  const { stream } = await createClient(directory).global.event({
    sseMaxRetryAttempts: 5,
    sseMaxRetryDelay: 3000,
  });

  if (isCancelled()) {
    await stream.return(undefined);
    return () => {};
  }

  let stopped = false;

  void (async () => {
    try {
      for await (const event of stream) {
        if (!stopped && !isCancelled() && event.directory === directory) {
          onEvent(event);
        }
      }
    } catch (error) {
      if (!stopped) console.error("OpenCode event stream failed", error);
    }
  })();

  return () => {
    stopped = true;
    void stream.return(undefined);
  };
}

export function applyStreamEvent(
  state: StreamState,
  event: GlobalEvent,
  sessionId: string,
): StreamState {
  const chatEvent = toChatEvent(event);
  return chatEvent ? applyChatEvent(state, chatEvent, sessionId) : state;
}

export function dispatchStreamEvent(
  event: GlobalEvent,
  sessionId: string,
): void {
  const chatEvent = toChatEvent(event);
  if (chatEvent) {
    useStreamingMessagesStore.getState().applyEvent(sessionId, chatEvent);
  }
}
