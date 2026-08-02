import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelConfig } from "@/types";

type DefaultModelStore = {
  defaultModel: ModelConfig | null;
  setDefaultModel: (model: ModelConfig | null) => void;
};

export const useDefaultModelStore = create<DefaultModelStore>()(
  persist(
    (set) => ({
      defaultModel: null,
      setDefaultModel: (model) => set({ defaultModel: model }),
    }),
    { name: "default-model", version: 1 }
  )
);
