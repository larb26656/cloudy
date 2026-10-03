import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProviderSettings } from "@repo/contracts";
import { cloudyClient } from "@/lib/api";
import { settingsKeys } from "@/lib/cloudy/query-keys";

export type ProviderSettingsConfig = { opencode: ProviderSettings };

export function useProviderSettings() {
  return useQuery({
    queryKey: settingsKeys.providers(),
    queryFn: async (): Promise<ProviderSettingsConfig> => {
      const res = await cloudyClient.api.settings.providers.$get();
      if (!res.ok)
        throw new Error(`Failed to load provider settings (${res.status})`);
      return res.json();
    },
  });
}

export function useUpdateProviderSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProviderSettingsConfig) => {
      const res = await cloudyClient.api.settings.providers.$patch({
        json: input,
      });
      if (!res.ok)
        throw new Error(`Failed to save provider settings (${res.status})`);
      return res.json();
    },
    onSuccess: (data) => {
      void queryClient.setQueryData(settingsKeys.providers(), data.providers);
    },
  });
}
