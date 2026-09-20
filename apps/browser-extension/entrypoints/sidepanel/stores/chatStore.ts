import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ModelSelectorModel } from "@repo/ui/components/model-selector";
import { extensionStorage } from "../lib/storage";

interface ChatStore {
  model: ModelSelectorModel | null;
  isGenerating: boolean;
  error: string | null;
  setModel: (model: ModelSelectorModel | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      model: null,
      isGenerating: false,
      error: null,
      setModel: (model) => set({ model }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setError: (error) => set({ error }),
    }),
    {
      name: "extension-selected-model",
      storage: createJSONStorage(() => extensionStorage),
      partialize: (state) => ({ model: state.model }),
      version: 1,
      migrate: (persistedState) => persistedState,
    },
  ),
);
