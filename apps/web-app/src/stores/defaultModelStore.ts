import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelInfo } from "@repo/contracts";
import { toModelInfo } from "@/lib/models";

type DefaultModelStore = {
  defaultModel: ModelInfo | null;
  setDefaultModel: (model: ModelInfo | null) => void;
};

export const useDefaultModelStore = create<DefaultModelStore>()(
  persist(
    (set) => ({
      defaultModel: null,
      setDefaultModel: (model) => set({ defaultModel: model }),
    }),
    {
      name: "default-model",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as { defaultModel?: unknown } | null;
        return {
          defaultModel: toModelInfo(state?.defaultModel),
        } as unknown as DefaultModelStore;
      },
    },
  ),
);
