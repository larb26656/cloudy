import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import { cloudyClient } from "@/lib/api";
import { settingsKeys } from "@/lib/cloudy/query-keys";

type ProviderSettingsResponse = InferResponseType<
  (typeof cloudyClient.api.settings.providers)["$get"],
  200
>;
export type ProviderInstance = ProviderSettingsResponse["instances"][number];
export type ProviderSettingsConfig = ProviderSettingsResponse;

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

export function useProviderTemplates() {
  return useQuery({
    queryKey: [...settingsKeys.providers(), "templates"],
    queryFn: async () => {
      const res = await cloudyClient.api.settings["provider-templates"].$get();
      if (!res.ok)
        throw new Error(`Failed to load provider templates (${res.status})`);
      return res.json();
    },
  });
}

export function useCreateProviderInstance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (json: Omit<ProviderInstance, "id">) => {
      const res = await cloudyClient.api.settings.providers.$post({ json });
      if (!res.ok) throw new Error(`Failed to add provider (${res.status})`);
      return res.json();
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: settingsKeys.providers() }),
  });
}

export function useUpdateProviderInstance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...json
    }: Partial<Omit<ProviderInstance, "id">> & { id: string }) => {
      const res = await cloudyClient.api.settings.providers[":id"].$patch({
        param: { id },
        json,
      });
      if (!res.ok) throw new Error(`Failed to update provider (${res.status})`);
      return res.json();
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: settingsKeys.providers() }),
  });
}

export function useDeleteProviderInstance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await cloudyClient.api.settings.providers[":id"].$delete({
        param: { id },
      });
      if (!res.ok) throw new Error(`Failed to remove provider (${res.status})`);
      return res.json();
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: settingsKeys.providers() }),
  });
}
