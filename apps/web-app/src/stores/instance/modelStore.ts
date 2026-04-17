import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getErrorMessage, type OCClient } from "@/lib/opencode";
import type { ModelConfig, ModelProvider } from "@/types";

export type ModelStoreState = {
  selectedModel: ModelConfig | null;
  providers: ModelProvider[];
  isLoading: boolean;
  error: string | null;
}

export type ModelStoreActions = {
  setSelectedModel: (model: ModelConfig | null) => void;
  fetchProviders: () => Promise<void>;
}

export type ModelStore = ModelStoreState & ModelStoreActions

export const createModelStore = (oc: OCClient) => create<ModelStore>()(
  persist(
    (set) => ({
      selectedModel: null,
      providers: [],
      isLoading: false,
      error: null,

      setSelectedModel: (model: ModelConfig | null) => {
        set({ selectedModel: model });
      },

      fetchProviders: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = await oc.config.providers();
          if (result.error) {
            throw new Error(getErrorMessage(result.error as Parameters<typeof getErrorMessage>[0]));
          }
          const data = result.data;
          const mappedProviders = data!.providers
            .map((p) => ({
              id: p.id,
              name: p.name,
              models: Object.values(p.models)
                .filter((m) => m.status === "active")
                .map((m) => ({
                  providerID: p.id,
                  modelID: m.id,
                  name: m.name,
                  description: `${m.family ?? ""} • ${m.limit.context.toLocaleString()} context`,
                  maxTokens: m.limit.context,
                  supportsStreaming: true,
                  supportsTools: m.capabilities.toolcall,
                })),
            }))
            .filter((p) => p.models.length > 0);
          set({ providers: mappedProviders, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false, providers: [] });
        }
      },
    }),
    {
      name: "model-storage",
      partialize: (state) => ({ selectedModel: state.selectedModel }),
    }
  )
);
