import { type GlobalEvent } from "@opencode-ai/sdk/v2/client";
import {
  applyMessageStreamEvent,
  useStreamingMessagesStore,
  type MessageStreamState,
} from "@repo/opencode";
import { createClient } from "./client";

export type StreamState = MessageStreamState;

export async function subscribeToEvents(
  directory: string,
  onEvent: (event: GlobalEvent) => void,
): Promise<() => void> {
  const { stream } = await createClient(directory).global.event({
    sseMaxRetryAttempts: 5,
    sseMaxRetryDelay: 3000,
  });
  let stopped = false;

  void (async () => {
    try {
      for await (const event of stream) {
        if (!stopped && event.directory === directory) onEvent(event);
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
  return applyMessageStreamEvent(state, event, sessionId);
}

export function dispatchStreamEvent(
  event: GlobalEvent,
  sessionId: string,
): void {
  useStreamingMessagesStore.getState().applyEvent(sessionId, event);
}
