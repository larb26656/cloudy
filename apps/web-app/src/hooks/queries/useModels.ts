import { useQuery } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: agentProviderKeys.catalog(),
    queryFn: fetchAgentProviderCatalog,
    select: (providers) =>
      providerId
        ? providers.filter((provider) => provider.id === providerId)
        : providers,
  });
}

export function useCapacity(providerId: string) {
  return useQuery({
    queryKey: agentProviderKeys.catalog(),
    queryFn: fetchAgentProviderCatalog,
    select: (providers): ResolvedProviderCapabilities | undefined =>
      providers.find((provider) => provider.id === providerId)?.capabilities,
  });
}
