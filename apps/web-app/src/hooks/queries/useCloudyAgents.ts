import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InferResponseType } from "hono/client";
import { cloudyClient } from "@/lib/api";
import { settingsKeys } from "@/lib/cloudy/query-keys";

type AgentsResponse = InferResponseType<
  (typeof cloudyClient.api.settings.agents)["$get"],
  200
>;
export type CloudyAgent = AgentsResponse["agents"][number];
export type CloudyAgentInput = Omit<CloudyAgent, "id" | "builtIn">;

export function useCloudyAgents() {
  return useQuery({
    queryKey: settingsKeys.agents(),
    queryFn: async () => {
      const response = await cloudyClient.api.settings.agents.$get();
      if (!response.ok) throw new Error("Failed to load agents");
      return response.json();
    },
  });
}

function useAgentMutation<TData>(
  mutationFn: (input: TData) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.agents() });
      void queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useCreateCloudyAgent() {
  return useAgentMutation<CloudyAgentInput>(async (json) => {
    const response = await cloudyClient.api.settings.agents.$post({ json });
    if (!response.ok) throw new Error("Failed to create agent");
    return response.json();
  });
}

export function useUpdateCloudyAgent() {
  return useAgentMutation<CloudyAgentInput & { id: string }>(
    async ({ id, ...json }) => {
      const response = await cloudyClient.api.settings.agents[":id"].$patch({
        param: { id },
        json,
      });
      if (!response.ok) throw new Error("Failed to update agent");
      return response.json();
    },
  );
}

export function useDeleteCloudyAgent() {
  return useAgentMutation<string>(async (id) => {
    const response = await cloudyClient.api.settings.agents[":id"].$delete({
      param: { id },
    });
    if (!response.ok) throw new Error("Failed to delete agent");
    return response.json();
  });
}
