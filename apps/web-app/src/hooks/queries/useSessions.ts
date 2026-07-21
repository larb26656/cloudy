import {
  getErrorMessage,
  getOcClient,
  messageKeys,
  sessionKeys,
  type SdkError,
} from "@/lib/opencode";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import type { Session, SessionStatus } from "@opencode-ai/sdk/v2";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ModelConfig } from "@/types";

export function useSession({
  sessionId,
  directory
}: {
  sessionId: string | null;
  directory?: string;
}) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId ?? ""),
    queryFn: async (): Promise<Session | null> => {
      if (!sessionId) return null;
      const oc = getOcClient();
      const result = await oc.session.get({ sessionID: sessionId, directory });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data;
    },
    enabled: !!sessionId,
  });
}

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

export function useSessionStatuses({ directory }: { directory: string }) {
  return useQuery({
    queryKey: sessionKeys.statuses(directory),
    queryFn: async (): Promise<Record<string, SessionStatus>> => {
      if (!directory) return {};
      const oc = getOcClient();
      const result = await oc.session.status({ directory });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data ?? {};
    },
    enabled: !!directory,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      directory,
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
      directory,
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
      directory,
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

      if (variables.directory) {
        queryClient.invalidateQueries({
          queryKey: sessionKeys.infinite(variables.directory),
        });
      }

    },
  });
}

export function useForkSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionID,
      directory,
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
      queryClient.setQueryData<Record<string, SessionStatus>>(
        sessionKeys.statuses(data.directory),
        (old) => ({ ...(old ?? {}), [data.id]: { type: "idle" } }),
      );
      useStreamingMessagesStore.getState().takeSessionStreaming(data.id);
      queryClient.invalidateQueries({
        queryKey: messageKeys.infinite(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.root(),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.infinite(data.directory),
      });
    },
  });
}
