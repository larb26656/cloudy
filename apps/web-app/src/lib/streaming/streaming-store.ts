import { create } from "zustand";
import type { ChatEvent, ChatMessage, MessagePart } from "@repo/contracts";
import {
  applyChatEvent,
  applyMessageInfo,
  applyMessagePart,
  applyMessagePartDelta,
  type MessageStreamState,
} from "./message-stream";

export interface StreamingMessagesStore {
  streamingMessages: Map<string, Map<string, ChatMessage>>;
  pendingDeltas: Map<string, Map<string, string>>;
  applyEvent: (sessionId: string, event: ChatEvent) => void;
  onMessageInfoUpdated: (sessionId: string, message: ChatMessage) => void;
  onMessagePartUpdated: (
    sessionId: string,
    messageId: string,
    part: MessagePart,
  ) => void;
  onMessagePartDeltaUpdated: (
    sessionId: string,
    messageId: string,
    partId: string,
    delta: string,
  ) => void;
  takeSessionStreaming: (sessionId: string) => ChatMessage[];
  removeStreamingMessage: (sessionId: string, messageId: string) => void;
}

function sessionState(
  store: StreamingMessagesStore,
  sessionId: string,
): MessageStreamState {
  return {
    messages: store.streamingMessages.get(sessionId) ?? new Map(),
    pendingDeltas: store.pendingDeltas.get(sessionId) ?? new Map(),
  };
}

export const useStreamingMessagesStore = create<StreamingMessagesStore>(
  (set) => {
    const update = (
      sessionId: string,
      reducer: (state: MessageStreamState) => MessageStreamState,
    ) => {
      set((state) => {
        const next = reducer(sessionState(state, sessionId));
        const streamingMessages = new Map(state.streamingMessages);
        const pendingDeltas = new Map(state.pendingDeltas);
        if (next.messages.size) streamingMessages.set(sessionId, next.messages);
        else streamingMessages.delete(sessionId);
        if (next.pendingDeltas.size)
          pendingDeltas.set(sessionId, next.pendingDeltas);
        else pendingDeltas.delete(sessionId);
        return { streamingMessages, pendingDeltas };
      });
    };

    return {
      streamingMessages: new Map(),
      pendingDeltas: new Map(),
      applyEvent: (sessionId, event) =>
        update(sessionId, (state) => applyChatEvent(state, event, sessionId)),
      onMessageInfoUpdated: (sessionId, message) =>
        update(sessionId, (state) => applyMessageInfo(state, message)),
      onMessagePartUpdated: (sessionId, messageId, part) =>
        update(sessionId, (state) =>
          applyMessagePart(state, sessionId, messageId, part),
        ),
      onMessagePartDeltaUpdated: (sessionId, messageId, partId, delta) =>
        update(sessionId, (state) =>
          applyMessagePartDelta(state, messageId, partId, delta),
        ),
      takeSessionStreaming: (sessionId) => {
        let result: ChatMessage[] = [];
        set((state) => {
          const messages = state.streamingMessages.get(sessionId);
          if (!messages) return state;
          result = Array.from(messages.values());
          const streamingMessages = new Map(state.streamingMessages);
          const pendingDeltas = new Map(state.pendingDeltas);
          streamingMessages.delete(sessionId);
          pendingDeltas.delete(sessionId);
          return { streamingMessages, pendingDeltas };
        });
        return result;
      },
      removeStreamingMessage: (sessionId, messageId) =>
        set((state) => {
          const messages = state.streamingMessages.get(sessionId);
          if (!messages?.has(messageId)) return state;
          const nextMessages = new Map(messages);
          nextMessages.delete(messageId);
          const streamingMessages = new Map(state.streamingMessages);
          if (nextMessages.size) streamingMessages.set(sessionId, nextMessages);
          else streamingMessages.delete(sessionId);
          return { streamingMessages };
        }),
    };
  },
);
