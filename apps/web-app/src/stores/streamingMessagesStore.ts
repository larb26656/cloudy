import { create } from "zustand";
import type { Message } from "@/types";
import type { Part } from "@opencode-ai/sdk/v2";

interface StreamingMessagesStore {
  streamingMessages: Map<string, Map<string, Message>>;
  pendingDeltas: Map<string, string>;
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

function ensureSessionMap(
  state: { streamingMessages: Map<string, Map<string, Message>> },
  sessionId: string,
): Map<string, Message> {
  return (
    state.streamingMessages.get(sessionId) ?? new Map<string, Message>()
  );
}

function getOrCreateMessage(
  sessionMap: Map<string, Message>,
  messageId: string,
  sessionId: string,
): Message {
  const existing = sessionMap.get(messageId);
  if (existing) return existing;
  return {
    info: {
      id: messageId,
      sessionID: sessionId,
      role: "assistant",
      time: { created: 0 },
    } as Message["info"],
    parts: [],
  };
}

export const useStreamingMessagesStore = create<StreamingMessagesStore>(
  (set) => ({
    streamingMessages: new Map(),
    pendingDeltas: new Map(),

    onMessageInfoUpdated: (sessionId, message) => {
      set((state) => {
        const sessionMap = ensureSessionMap(state, sessionId);
        const existing = sessionMap.get(message.info.id);
        const merged: Message = existing
          ? { ...message, parts: existing.parts }
          : message;
        const nextSessionMap = new Map(sessionMap).set(message.info.id, merged);
        const nextMap = new Map(state.streamingMessages).set(
          sessionId,
          nextSessionMap,
        );
        return { streamingMessages: nextMap };
      });
    },

    onMessagePartUpdated: (sessionId, part) => {
      set((state) => {
        const sessionMap = ensureSessionMap(state, sessionId);
        const target = getOrCreateMessage(
          sessionMap,
          part.messageID,
          sessionId,
        );

        const pending = state.pendingDeltas.get(part.id);
        const mergedPart =
          pending && (part.type === "text" || part.type === "reasoning")
            ? { ...part, text: part.text + pending }
            : part;

        const existingIdx = target.parts.findIndex((p) => p.id === part.id);
        const nextParts =
          existingIdx === -1
            ? [...target.parts, mergedPart]
            : target.parts.map((p, i) => (i === existingIdx ? mergedPart : p));

        const nextSessionMap = new Map(sessionMap).set(part.messageID, {
          ...target,
          parts: nextParts,
        });
        const nextMap = new Map(state.streamingMessages).set(
          sessionId,
          nextSessionMap,
        );

        const nextPending = new Map(state.pendingDeltas);
        nextPending.delete(part.id);

        return { streamingMessages: nextMap, pendingDeltas: nextPending };
      });
    },

    onMessagePartDeltaUpdated: (sessionId, messageId, partId, delta) => {
      set((state) => {
        const sessionMap = ensureSessionMap(state, sessionId);
        const target = getOrCreateMessage(sessionMap, messageId, sessionId);

        const existingIdx = target.parts.findIndex((p) => p.id === partId);

        if (existingIdx === -1) {
          const nextPending = new Map(state.pendingDeltas);
          nextPending.set(partId, (nextPending.get(partId) ?? "") + delta);
          return { streamingMessages: state.streamingMessages, pendingDeltas: nextPending };
        }

        const nextParts = target.parts.map((p, i) => {
          if (i !== existingIdx) return p;
          if (p.type === "text" || p.type === "reasoning") {
            return { ...p, text: p.text + delta };
          }
          return p;
        });

        const nextSessionMap = new Map(sessionMap).set(messageId, {
          ...target,
          parts: nextParts,
        });
        const nextMap = new Map(state.streamingMessages).set(
          sessionId,
          nextSessionMap,
        );
        return { streamingMessages: nextMap };
      });
    },

    takeSessionStreaming: (sessionId) => {
      let result: Message[] = [];
      set((state) => {
        const sessionMap = state.streamingMessages.get(sessionId);
        if (!sessionMap) return state;
        result = Array.from(sessionMap.values());
        const nextMap = new Map(state.streamingMessages);
        nextMap.delete(sessionId);

        return { streamingMessages: nextMap };
      });
      return result;
    },

    removeStreamingMessage: (sessionId, messageId) => {
      set((state) => {
        const sessionMap = state.streamingMessages.get(sessionId);
        if (!sessionMap || !sessionMap.has(messageId)) return state;

        const nextSessionMap = new Map(sessionMap);
        nextSessionMap.delete(messageId);

        const nextMap = new Map(state.streamingMessages);
        if (nextSessionMap.size === 0) {
          nextMap.delete(sessionId);
        } else {
          nextMap.set(sessionId, nextSessionMap);
        }

        return { streamingMessages: nextMap };
      });
    },
  }),
);
