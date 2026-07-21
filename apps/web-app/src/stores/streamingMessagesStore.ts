import { create } from "zustand";
import type { Message } from "@/types";
import type { Part } from "@opencode-ai/sdk/v2";

interface StreamingMessagesStore {
  streamingMessages: Map<string, Map<string, Message>>;
  onMessageInfoUpdated: (sessionId: string, message: Message) => void;
  onMessagePartUpdated: (sessionId: string, part: Part) => void;
  onMessagePartDeltaUpdated: (sessionId: string, msessageId: string, partId: string, delta: string) => void;
  takeSessionStreaming: (sessionId: string) => Message[];
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

        const existingIdx = target.parts.findIndex((p) => p.id === part.id);
        const nextParts =
          existingIdx === -1
            ? [...target.parts, part]
            : target.parts.map((p, i) => (i === existingIdx ? part : p));

        const nextSessionMap = new Map(sessionMap).set(part.messageID, {
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

    onMessagePartDeltaUpdated: (sessionId, messageId, partId, delta) => {
      set((state) => {
        const sessionMap = ensureSessionMap(state, sessionId);
        const target = getOrCreateMessage(sessionMap, messageId, sessionId);

        const existingIdx = target.parts.findIndex((p) => p.id === partId);
        let nextParts: Part[];
        if (existingIdx === -1) {
          const placeholder: Part = {
            id: partId,
            sessionID: sessionId,
            messageID: messageId,
            type: "text",
            text: delta,
          } as Part;
          nextParts = [...target.parts, placeholder];
        } else {
          nextParts = target.parts.map((p, i) => {
            if (i !== existingIdx) return p;
            if (p.type === "text") {
              return { ...p, text: p.text + delta };
            }
            return p;
          });
        }

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
  }),
);
