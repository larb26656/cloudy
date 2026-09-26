import { create } from "zustand";
import type { ChatEvent, ChatMessage, MessagePart } from "@repo/ai-core";
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
    field?: string,
  ) => void;
  takeSessionStreaming: (sessionId: string) => ChatMessage[];
  removeStreamingMessage: (sessionId: string, messageId: string) => void;
}

function stateFor(
  messages: Map<string, Map<string, ChatMessage>>,
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
        update(sessionId, (state) => applyChatEvent(state, event, sessionId));
      },
      onMessageInfoUpdated: (sessionId, message) => {
        update(sessionId, (state) => applyMessageInfo(state, message));
      },
      onMessagePartUpdated: (sessionId, messageId, part) => {
        update(sessionId, (state) =>
          applyMessagePart(state, sessionId, messageId, part),
        );
      },
      onMessagePartDeltaUpdated: (sessionId, messageId, partId, delta) => {
        update(sessionId, (state) =>
          applyMessagePartDelta(state, messageId, partId, delta),
        );
      },
      takeSessionStreaming: (sessionId) => {
        let result: ChatMessage[] = [];
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
