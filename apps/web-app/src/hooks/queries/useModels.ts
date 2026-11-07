import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ResolvedAgentProviderInfo,
  ResolvedProviderCapabilities,
} from "@repo/contracts";
import { cloudyClient } from "@/lib/api";
import { agentProviderKeys } from "@/lib/cloudy/query-keys";

export async function fetchAgentProviderCatalog(): Promise<
  ResolvedAgentProviderInfo[]
> {
  const res = await cloudyClient.api["agent-providers"].$get();
  if (!res.ok) {
    throw new Error(`Failed to load model catalog (${res.status})`);
  }
  const catalog = await res.json();
  return catalog.providers;
}

export function useModels(providerId?: string) {
  const queryClient = useQueryClient();
  const refresh = useMutation({
    mutationFn: async () => {
      if (!providerId) throw new Error("No provider selected");
      const response = await cloudyClient.api["agent-providers"][
        ":providerId"
      ].models.refresh.$post({ param: { providerId } });
      if (!response.ok)
        throw new Error(`Model refresh failed (${response.status})`);
      return response.json();
    },
    onSuccess: (provider) => {
      queryClient.setQueryData<ResolvedAgentProviderInfo[]>(
        agentProviderKeys.catalog(),
        (previous = []) =>
          previous.some((item) => item.id === provider.id)
            ? previous.map((item) =>
                item.id === provider.id ? provider : item,
              )
            : [...previous, provider],
      );
    },
  });
  const query = useQuery({
    queryKey: agentProviderKeys.catalog(),
    queryFn: fetchAgentProviderCatalog,
    select: (providers) =>
      providerId
        ? providers.filter((provider) => provider.id === providerId)
        : providers,
  });
  return {
    ...query,
    refreshModels: refresh.mutate,
    isRefreshingModels: refresh.isPending,
    refreshError: refresh.error,
  };
}

export function useCapacity(providerId: string) {
  return useQuery({
    queryKey: agentProviderKeys.catalog(),
    queryFn: fetchAgentProviderCatalog,
    select: (providers): ResolvedProviderCapabilities | undefined =>
      providers.find((provider) => provider.id === providerId)?.capabilities,
  });
}
