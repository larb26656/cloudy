import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelInfo } from "@repo/contracts";
import { toModelInfo } from "@/lib/models";

type DefaultModelStore = {
  defaultModels: Record<string, ModelInfo | null>;
  setDefaultModel: (providerId: string, model: ModelInfo | null) => void;
};

export const useDefaultModelStore = create<DefaultModelStore>()(
  persist(
    (set) => ({
      defaultModels: {},
      setDefaultModel: (providerId, model) =>
        set((state) => ({
          defaultModels: { ...state.defaultModels, [providerId]: model },
        })),
    }),
    {
      name: "default-model",
      version: 3,
      migrate: (persisted) => {
        const state = persisted as { defaultModel?: unknown } | null;
        const defaultModel = toModelInfo(state?.defaultModel);
        return {
          defaultModels: defaultModel ? { opencode: defaultModel } : {},
        } as DefaultModelStore;
      },
    },
  ),
);
