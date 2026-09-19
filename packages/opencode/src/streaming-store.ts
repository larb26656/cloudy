import { create } from "zustand";
import type { GlobalEvent, Part } from "@opencode-ai/sdk/v2";
import {
  applyMessageInfo,
  applyMessagePart,
  applyMessagePartDelta,
  applyMessageStreamEvent,
  type Message,
  type MessageStreamState,
} from "./message-stream";

export interface StreamingMessagesStore {
  streamingMessages: Map<string, Map<string, Message>>;
  pendingDeltas: Map<string, Map<string, string>>;
  applyEvent: (sessionId: string, event: GlobalEvent) => void;
  onMessageInfoUpdated: (sessionId: string, message: Message) => void;
  onMessagePartUpdated: (sessionId: string, part: Part) => void;
  onMessagePartDeltaUpdated: (
    sessionId: string,
    messageId: string,
    partId: string,
    delta: string,
    field?: string,
  ) => void;
  takeSessionStreaming: (sessionId: string) => Message[];
  removeStreamingMessage: (sessionId: string, messageId: string) => void;
}

function stateFor(
  messages: Map<string, Map<string, Message>>,
  pendingDeltas: Map<string, Map<string, string>>,
  sessionId: string,
): MessageStreamState {
  return {
    messages: messages.get(sessionId) ?? new Map(),
    pendingDeltas: pendingDeltas.get(sessionId) ?? new Map(),
  };
}

function applySessionState(
  state: StreamingMessagesStore,
  sessionId: string,
  next: MessageStreamState,
) {
  const streamingMessages = new Map(state.streamingMessages);
  const pendingDeltas = new Map(state.pendingDeltas);

  if (next.messages.size === 0) streamingMessages.delete(sessionId);
  else streamingMessages.set(sessionId, next.messages);
  if (next.pendingDeltas.size === 0) pendingDeltas.delete(sessionId);
  else pendingDeltas.set(sessionId, next.pendingDeltas);

  return { streamingMessages, pendingDeltas };
}

export const useStreamingMessagesStore = create<StreamingMessagesStore>(
  (set) => {
    const update = (
      sessionId: string,
      reducer: (state: MessageStreamState) => MessageStreamState,
    ) => {
      set((state) =>
        applySessionState(
          state,
          sessionId,
          reducer(
            stateFor(state.streamingMessages, state.pendingDeltas, sessionId),
          ),
        ),
      );
    };

    return {
      streamingMessages: new Map(),
      pendingDeltas: new Map(),
      applyEvent: (sessionId, event) => {
        update(sessionId, (state) =>
          applyMessageStreamEvent(state, event, sessionId),
        );
      },
      onMessageInfoUpdated: (sessionId, message) => {
        update(sessionId, (state) => applyMessageInfo(state, message));
      },
      onMessagePartUpdated: (sessionId, part) => {
        update(sessionId, (state) => applyMessagePart(state, sessionId, part));
      },
      onMessagePartDeltaUpdated: (sessionId, messageId, partId, delta) => {
        update(sessionId, (state) =>
          applyMessagePartDelta(state, messageId, partId, delta),
        );
      },
      takeSessionStreaming: (sessionId) => {
        let result: Message[] = [];
        set((state) => {
          const sessionMessages = state.streamingMessages.get(sessionId);
          if (!sessionMessages) return state;
          result = Array.from(sessionMessages.values());
          const streamingMessages = new Map(state.streamingMessages);
          const pendingDeltas = new Map(state.pendingDeltas);
          streamingMessages.delete(sessionId);
          pendingDeltas.delete(sessionId);
          return { streamingMessages, pendingDeltas };
        });
        return result;
      },
      removeStreamingMessage: (sessionId, messageId) => {
        set((state) => {
          const sessionMessages = state.streamingMessages.get(sessionId);
          if (!sessionMessages?.has(messageId)) return state;
          const nextSessionMessages = new Map(sessionMessages);
          nextSessionMessages.delete(messageId);
          const streamingMessages = new Map(state.streamingMessages);
          if (nextSessionMessages.size === 0)
            streamingMessages.delete(sessionId);
          else streamingMessages.set(sessionId, nextSessionMessages);
          return { streamingMessages };
        });
      },
    };
  },
);
