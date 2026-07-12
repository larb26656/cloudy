import { useQuery } from "@tanstack/react-query";
import {
  getOcClient,
  getErrorMessage,
  modelKeys,
  type SdkError,
} from "@/lib/opencode";
import type { ModelConfig, ModelProvider } from "@/types/models";

export function useModels() {
  return useQuery({
    queryKey: modelKeys.providers(),
    queryFn: async (): Promise<ModelProvider[]> => {
      const oc = getOcClient();
      const result = await oc.config.providers();
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      const data = result.data;
      if (!data) return [];
      return data.providers
        .map((p) => ({
          id: p.id,
          name: p.name,
          models: Object.values(p.models)
            .filter((m) => m.status === "active")
            .map((m) => {
              const cfg: ModelConfig = {
                providerID: p.id,
                modelID: m.id,
                name: m.name,
                description: `${m.family ?? ""} • ${m.limit.context.toLocaleString()} context`,
                maxTokens: m.limit.context,
                supportsStreaming: true,
                supportsTools: m.capabilities.toolcall,
              };
              return cfg;
            }),
        }))
        .filter((p) => p.models.length > 0);
    },
  });
}
