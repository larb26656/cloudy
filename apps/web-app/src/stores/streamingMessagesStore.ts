import { create } from "zustand";
import type { Message } from "@/types";
import type { Part } from "@opencode-ai/sdk/v2";

interface StreamingMessagesStore {
  streamingMessages: Map<string, Map<string, Message>>;
  onMessageInfoUpdated: (sessionId: string, message: Message) => void;
  onMessagePartUpdated: (sessionId: string, part: Part) => void;
  takeSessionStreaming: (sessionId: string) => Message[];
}

export const useStreamingMessagesStore = create<StreamingMessagesStore>(
  (set) => ({
    streamingMessages: new Map(),

    onMessageInfoUpdated: (sessionId, message) => {
      set((state) => {
        const sessionMap =
          state.streamingMessages.get(sessionId) ?? new Map<string, Message>();
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
        const sessionMap = state.streamingMessages.get(sessionId);
        const target = sessionMap?.get(part.messageID);
        if (!sessionMap || !target) return state;

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
