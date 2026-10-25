import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono/client";
import { cloudyClient } from "@/lib/api";
import { automationKeys } from "@/lib/cloudy/query-keys";

const automationApi = cloudyClient.api.automations;
type Automation = InferResponseType<typeof automationApi.$get, 200>[number];
type AutomationInput = InferRequestType<typeof automationApi.$post>["json"];
type AutomationUpdate = InferRequestType<
  (typeof automationApi)[":id"]["$patch"]
>["json"];
type Run = InferResponseType<
  (typeof automationApi)[":id"]["runs"]["$get"],
  200
>[number];

export function useAutomations() {
  return useQuery({
    queryKey: automationKeys.list(),
    queryFn: async (): Promise<Automation[]> => {
      const response = await automationApi.$get();
      if (!response.ok)
        throw new Error(`Failed to load automations (${response.status})`);
      return response.json();
    },
  });
}

export function useAutomationRuns(id: string | null) {
  return useQuery({
    queryKey: automationKeys.runs(id ?? ""),
    enabled: !!id,
    refetchInterval: 3000,
    queryFn: async (): Promise<Run[]> => {
      if (!id) return [];
      const response = await automationApi[":id"].runs.$get({ param: { id } });
      if (!response.ok)
        throw new Error(`Failed to load runs (${response.status})`);
      return response.json();
    },
  });
}

export function useSchedulePreview(id: string | null) {
  return useQuery({
    queryKey: automationKeys.preview(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return { occurrences: [] };
      const response = await automationApi[":id"].schedule.preview.$get({
        param: { id },
      });
      if (!response.ok)
        throw new Error(`Failed to preview schedule (${response.status})`);
      return response.json();
    },
  });
}

function useAutomationMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (_result, variables) => {
      await client.invalidateQueries({ queryKey: automationKeys.root() });
      if (
        typeof variables === "object" &&
        variables !== null &&
        "id" in variables
      ) {
        await client.invalidateQueries({
          queryKey: automationKeys.runs(String(variables.id)),
        });
      }
    },
  });
}

export function useCreateAutomation() {
  return useAutomationMutation(async (json: AutomationInput) => {
    const response = await automationApi.$post({ json });
    if (!response.ok)
      throw new Error(`Failed to create automation (${response.status})`);
    return response.json();
  });
}

export function useUpdateAutomation() {
  return useAutomationMutation(
    async ({ id, ...json }: AutomationUpdate & { id: string }) => {
      const response = await automationApi[":id"].$patch({
        param: { id },
        json,
      });
      if (!response.ok)
        throw new Error(`Failed to update automation (${response.status})`);
      return response.json();
    },
  );
}

export function useDeleteAutomation() {
  return useAutomationMutation(async (id: string) => {
    const response = await automationApi[":id"].$delete({ param: { id } });
    if (!response.ok)
      throw new Error(`Failed to delete automation (${response.status})`);
  });
}

export function useRunAutomation() {
  return useAutomationMutation(async (id: string) => {
    const response = await automationApi[":id"].runs.$post({ param: { id } });
    if (!response.ok)
      throw new Error(`Failed to start run (${response.status})`);
    return response.json();
  });
}

export function useStopAutomationRun() {
  return useAutomationMutation(
    async ({ id, runId }: { id: string; runId: string }) => {
      const response = await automationApi[":id"].runs[":runId"].stop.$post({
        param: { id, runId },
      });
      if (!response.ok)
        throw new Error(`Failed to stop run (${response.status})`);
      return response.json();
    },
  );
}

export type { Automation, AutomationInput, AutomationUpdate, Run };
