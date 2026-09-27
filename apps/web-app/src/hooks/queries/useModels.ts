import { useQuery } from "@tanstack/react-query";
import type { ProviderInfo } from "@repo/contracts";
import { cloudyClient } from "@/lib/api";
import { providerKeys } from "@/lib/cloudy/query-keys";

export async function fetchProviderCatalog(): Promise<ProviderInfo[]> {
  const res = await cloudyClient.api.providers.$get();
  if (!res.ok) {
    throw new Error(`Failed to load model catalog (${res.status})`);
  }
  return res.json();
}

export function useModels() {
  return useQuery({
    queryKey: providerKeys.catalog(),
    queryFn: fetchProviderCatalog,
  });
}
