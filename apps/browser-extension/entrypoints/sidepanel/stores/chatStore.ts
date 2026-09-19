import { create } from "zustand";
import type { ModelSelectorModel } from "@repo/ui/components/model-selector";

interface ChatStore {
  model: ModelSelectorModel | null;
  isGenerating: boolean;
  error: string | null;
  setModel: (model: ModelSelectorModel | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  model: null,
  isGenerating: false,
  error: null,
  setModel: (model) => set({ model }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setError: (error) => set({ error }),
}));
