import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import { cloudyClient } from "@/lib/api";
import { settingsKeys } from "@/lib/cloudy/query-keys";

type AgentProviderSettingsResponse = InferResponseType<
  (typeof cloudyClient.api.settings)["agent-providers"]["$get"],
  200
>;
export type AgentProviderInstance =
  AgentProviderSettingsResponse["instances"][number];
export type AgentProviderSettingsConfig = AgentProviderSettingsResponse;

export function useAgentProviderSettings() {
  return useQuery({
    queryKey: settingsKeys.agentProviders(),
    queryFn: async (): Promise<AgentProviderSettingsConfig> => {
      const res = await cloudyClient.api.settings["agent-providers"].$get();
      if (!res.ok)
        throw new Error(`Failed to load provider settings (${res.status})`);
      return res.json();
    },
  });
}

export function useAgentProviderTemplates() {
  return useQuery({
    queryKey: [...settingsKeys.agentProviders(), "templates"],
    queryFn: async () => {
      const res =
        await cloudyClient.api.settings["agent-provider-templates"].$get();
      if (!res.ok)
        throw new Error(`Failed to load provider templates (${res.status})`);
      return res.json();
    },
  });
}

export function useCreateAgentProviderInstance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (json: Omit<AgentProviderInstance, "id">) => {
      const res = await cloudyClient.api.settings["agent-providers"].$post({
        json,
      });
      if (!res.ok) throw new Error(`Failed to add provider (${res.status})`);
      return res.json();
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: settingsKeys.agentProviders() }),
  });
}

export function useUpdateAgentProviderInstance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...json
    }: Partial<Omit<AgentProviderInstance, "id">> & { id: string }) => {
      const res = await cloudyClient.api.settings["agent-providers"][
        ":id"
      ].$patch({
        param: { id },
        json,
      });
      if (!res.ok) throw new Error(`Failed to update provider (${res.status})`);
      return res.json();
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: settingsKeys.agentProviders() }),
  });
}

export function useDeleteAgentProviderInstance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await cloudyClient.api.settings["agent-providers"][
        ":id"
      ].$delete({ param: { id } });
      if (!res.ok) throw new Error(`Failed to remove provider (${res.status})`);
      return res.json();
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: settingsKeys.agentProviders() }),
  });
}
