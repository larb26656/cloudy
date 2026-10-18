import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono/client";
import { cloudyClient } from "@/lib/api";
import { llmProviderKeys } from "@/lib/cloudy/query-keys";

type Endpoint = (typeof cloudyClient.api)["llm-providers"];
type ConnectionEndpoint = Endpoint["connections"];
export type LLMSettings = InferResponseType<Endpoint["$get"], 200>;
export type LLMConnection = LLMSettings["connections"][number];
type CreateInput = InferRequestType<ConnectionEndpoint["$post"]>["json"];
type UpdateInput = InferRequestType<
  ConnectionEndpoint[":id"]["$patch"]
>["json"];
type DefaultInput = InferRequestType<Endpoint["default"]["$put"]>["json"];

export function useLLMProviderSettings() {
  return useQuery({
    queryKey: llmProviderKeys.settings(),
    queryFn: async () => {
      const response = await cloudyClient.api["llm-providers"].$get();
      if (!response.ok)
        throw new Error(`Failed to load LLM connections (${response.status})`);
      return response.json();
    },
  });
}

function useLLMMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: llmProviderKeys.settings() }),
  });
}

export function useCreateLLMConnection() {
  return useLLMMutation<CreateInput>(async (json) => {
    const response = await cloudyClient.api["llm-providers"].connections.$post({
      json,
    });
    if (!response.ok)
      throw new Error(`Failed to add connection (${response.status})`);
    return response.json();
  });
}

export function useUpdateLLMConnection() {
  return useLLMMutation<{ id: string } & UpdateInput>(
    async ({ id, ...json }) => {
      const response = await cloudyClient.api["llm-providers"].connections[
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
    const response = await cloudyClient.api["llm-providers"].connections[
      ":id"
    ].$delete({ param: { id } });
    if (!response.ok)
      throw new Error(`Failed to delete connection (${response.status})`);
    return response.json();
  });
}

export function useSetLLMDefault() {
  return useLLMMutation<DefaultInput>(async (json) => {
    const response = await cloudyClient.api["llm-providers"].default.$put({
      json,
    });
    if (!response.ok)
      throw new Error(`Failed to set default (${response.status})`);
    return response.json();
  });
}
