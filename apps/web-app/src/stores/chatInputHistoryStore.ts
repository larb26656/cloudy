import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ENTRIES = 50;

type ChatInputHistoryStore = {
  sessions: Record<string, string[]>;
  addEntry: (sessionId: string, text: string) => void;
};

export const useChatInputHistoryStore = create<ChatInputHistoryStore>()(
  persist(
    (set) => ({
      sessions: {},
      addEntry: (sessionId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((state) => {
          const prev = state.sessions[sessionId] ?? [];
          if (prev[prev.length - 1] === trimmed) return state;
          const next = [...prev, trimmed];
          if (next.length > MAX_ENTRIES) next.shift();
          return {
            sessions: { ...state.sessions, [sessionId]: next },
          };
        });
      },
    }),
    {
      name: "chat-input-history",
      version: 1,
      migrate: (state) => state,
    },
  ),
);

export { MAX_ENTRIES };
