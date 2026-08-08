import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_PHRASES = 10;

type QuickPhrasesStore = {
  phrases: string[];
  addPhrase: (text: string) => void;
  removePhrase: (index: number) => void;
  updatePhrase: (index: number, text: string) => void;
  setPhrases: (phrases: string[]) => void;
};

export const useQuickPhrasesStore = create<QuickPhrasesStore>()(
  persist(
    (set) => ({
      phrases: [],
      addPhrase: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((state) => {
          if (state.phrases.length >= MAX_PHRASES) return state;
          return { phrases: [...state.phrases, trimmed] };
        });
      },
      removePhrase: (index) =>
        set((state) => ({
          phrases: state.phrases.filter((_, i) => i !== index),
        })),
      updatePhrase: (index, text) =>
        set((state) => ({
          phrases: state.phrases.map((p, i) => (i === index ? text : p)),
        })),
      setPhrases: (phrases) => set({ phrases: phrases.slice(0, MAX_PHRASES) }),
    }),
    {
      name: "quick-phrases",
      version: 1,
      migrate: (state) => state,
    },
  ),
);

export { MAX_PHRASES };
