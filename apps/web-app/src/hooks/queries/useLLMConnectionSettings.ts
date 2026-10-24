import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono/client";
import { cloudyClient } from "@/lib/api";
import { agentProviderKeys, llmConnectionKeys } from "@/lib/cloudy/query-keys";

type Endpoint = (typeof cloudyClient.api)["llm-connections"];
type ConnectionEndpoint = Endpoint["connections"];
export type LLMSettings = InferResponseType<Endpoint["$get"], 200>;
export type LLMConnection = LLMSettings["connections"][number];
type CreateInput = InferRequestType<ConnectionEndpoint["$post"]>["json"];
type UpdateInput = InferRequestType<
  ConnectionEndpoint[":id"]["$patch"]
>["json"];

export function useLLMConnectionSettings() {
  return useQuery({
    queryKey: llmConnectionKeys.settings(),
    queryFn: async () => {
      const response = await cloudyClient.api["llm-connections"].$get();
      if (!response.ok)
        throw new Error(`Failed to load LLM connections (${response.status})`);
      return response.json();
    },
  });
}

export function useChatGPTPlanStatus() {
  const client = useQueryClient();
  return useQuery({
    queryKey: [...llmConnectionKeys.settings(), "chatgpt-plan"],
    queryFn: async () => {
      const response =
        await cloudyClient.api["llm-connections"]["chatgpt-plan"].$get();
      if (!response.ok)
        throw new Error("Failed to load ChatGPT connection status");
      const status = await response.json();
      if (status.connected)
        void client.invalidateQueries({
          queryKey: agentProviderKeys.catalog(),
        });
      return status;
    },
    refetchInterval: (query) => (query.state.data?.connecting ? 1500 : false),
  });
}

export function useConnectChatGPTPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response =
        await cloudyClient.api["llm-connections"][
          "chatgpt-plan"
        ].connect.$post();
      if (!response.ok) throw new Error("Could not start ChatGPT sign-in");
      return response.json();
    },
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: [...llmConnectionKeys.settings(), "chatgpt-plan"],
      }),
  });
}

export function useCancelChatGPTPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response =
        await cloudyClient.api["llm-connections"][
          "chatgpt-plan"
        ].cancel.$post();
      if (!response.ok) throw new Error("Could not cancel ChatGPT sign-in");
      return response.json();
    },
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: [...llmConnectionKeys.settings(), "chatgpt-plan"],
      }),
  });
}

export function useDisconnectChatGPTPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response =
        await cloudyClient.api["llm-connections"]["chatgpt-plan"].$delete();
      if (!response.ok) throw new Error("Could not disconnect ChatGPT");
      return response.json();
    },
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: [...llmConnectionKeys.settings(), "chatgpt-plan"],
      });
      void client.invalidateQueries({ queryKey: agentProviderKeys.catalog() });
    },
  });
}

function useLLMMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: llmConnectionKeys.settings() }),
  });
}

export function useCreateLLMConnection() {
  return useLLMMutation<CreateInput>(async (json) => {
    const response = await cloudyClient.api[
      "llm-connections"
    ].connections.$post({ json });
    if (!response.ok)
      throw new Error(`Failed to add connection (${response.status})`);
    return response.json();
  });
}

export function useUpdateLLMConnection() {
  return useLLMMutation<{ id: string } & UpdateInput>(
    async ({ id, ...json }) => {
      const response = await cloudyClient.api["llm-connections"].connections[
        ":id"
      ].$patch({ param: { id }, json });
      if (!response.ok)
        throw new Error(`Failed to update connection (${response.status})`);
      return response.json();
    },
  );
}

export function useDeleteLLMConnection() {
  return useLLMMutation<string>(async (id) => {
    const response = await cloudyClient.api["llm-connections"].connections[
      ":id"
    ].$delete({ param: { id } });
    if (!response.ok)
      throw new Error(`Failed to delete connection (${response.status})`);
    return response.json();
  });
}
