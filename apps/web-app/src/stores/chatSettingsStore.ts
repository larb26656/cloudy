import { create } from "zustand";
import { persist } from "zustand/middleware";

type ChatSettingsStore = {
  autoExpandThinking: boolean;
  setAutoExpandThinking: (value: boolean) => void;
};

export const useChatSettingsStore = create<ChatSettingsStore>()(
  persist(
    (set) => ({
      autoExpandThinking: false,
      setAutoExpandThinking: (value) => set({ autoExpandThinking: value }),
    }),
    { name: "chat-settings" }
  )
);
