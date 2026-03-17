import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelConfig } from "@/types";

type ModelStoreState = {
  selectedModel: ModelConfig | null;
}

type ModelStoreActions = {
  setSelectedModel: (model: ModelConfig | null) => void;
}

type ModelStore = ModelStoreState & ModelStoreActions

export const useModelStore = create<ModelStore>()(persist(
  (set) => ({
    selectedModel: null,

    setSelectedModel: (model: ModelConfig | null) => {
      set({ selectedModel: model });
    },
  }),
  {
    name: 'model-storage',
  }
))
