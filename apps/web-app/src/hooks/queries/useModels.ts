import { useQuery } from "@tanstack/react-query";
import type { AgentProviderInfo } from "@repo/contracts";
import { cloudyClient } from "@/lib/api";
import { agentProviderKeys } from "@/lib/cloudy/query-keys";

export async function fetchAgentProviderCatalog(): Promise<
  AgentProviderInfo[]
> {
  const res = await cloudyClient.api["agent-providers"].$get();
  if (!res.ok) {
    throw new Error(`Failed to load model catalog (${res.status})`);
  }
  return res.json();
}

export function useModels(providerId?: string) {
  return useQuery({
    queryKey: [...agentProviderKeys.catalog(), providerId ?? "all"],
    queryFn: async () => {
      const providers = await fetchAgentProviderCatalog();
      return providerId
        ? providers.filter((provider) => provider.id === providerId)
        : providers;
    },
  });
}
