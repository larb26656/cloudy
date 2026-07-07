import {
  getErrorMessage,
  getOcClient,
  sessionKeys,
  type SdkError,
} from "@/lib/opencode";
import { OC_DIRECTORY } from "@/lib/opencode/oc-instance";
import type { Session } from "@opencode-ai/sdk/v2";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ModelConfig } from "@/types";

export function useSessions({ directory }: { directory: string }) {
  return useQuery({
    queryKey: sessionKeys.infinite(directory),
    queryFn: async (): Promise<Session[]> => {
      const oc = getOcClient();
      const result = await oc.session.list({ directory });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      const data = result.data;

      return data;
    },
    enabled: !!directory,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      directory = OC_DIRECTORY,
      parentID,
      title,
      agent,
      model,
    }: {
      directory?: string;
      parentID?: string;
      title?: string;
      agent?: string;
      model?: ModelConfig;
    }): Promise<Session> => {
      const oc = getOcClient();
      console.log(directory);
      const result = await oc.session.create(
        {
          directory,
          parentID,
          title,
          agent,
          model: model
            ? { id: model.modelID, providerID: model.providerID }
            : undefined,
        },
        {
          headers: {
            "x-opencode-directory": directory,
          },
        },
      );
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.root(),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.infinite(data.directory),
      });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionID,
      directory = OC_DIRECTORY,
      title,
      metadata,
    }: {
      sessionID: string;
      directory?: string;
      title?: string;
      metadata?: Record<string, unknown>;
    }): Promise<Session> => {
      const oc = getOcClient();
      const result = await oc.session.update({
        sessionID,
        directory,
        title,
        metadata,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.root(),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.infinite(data.directory),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(data.id),
      });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionID,
      directory = OC_DIRECTORY,
    }: {
      sessionID: string;
      directory?: string;
    }): Promise<void> => {
      const oc = getOcClient();
      const result = await oc.session.delete({
        sessionID,
        directory,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.root(),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.infinite(variables.directory ?? OC_DIRECTORY),
      });
    },
  });
}

export function useForkSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionID,
      directory = OC_DIRECTORY,
      messageID,
    }: {
      sessionID: string;
      directory?: string;
      messageID?: string;
    }): Promise<Session> => {
      const oc = getOcClient();
      const result = await oc.session.fork({
        sessionID,
        directory,
        messageID,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.root(),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.infinite(data.directory),
      });
    },
  });
}
