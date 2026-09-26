import {
  CHAT_POLL_INTERVAL,
  getErrorMessage,
  getOcClient,
  messageKeys,
  sessionKeys,
  type SdkError,
} from "@/lib/opencode";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import {
  toChatSession,
  toRecentChatSession,
  toSessionRunStatus,
} from "@/lib/opencode/adapter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ChatSession,
  ModelConfig,
  RecentChatSession,
  SessionRunStatus,
} from "@/types";

export function useSession({
  sessionId,
  directory,
}: {
  sessionId: string | null;
  directory?: string;
}) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId ?? ""),
    queryFn: async (): Promise<ChatSession | null> => {
      if (!sessionId) return null;
      const oc = getOcClient();
      const result = await oc.session.get({ sessionID: sessionId, directory });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return toChatSession(result.data);
    },
    enabled: !!sessionId,
    refetchInterval: CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useSessions({ directory }: { directory: string }) {
  return useQuery({
    queryKey: sessionKeys.infinite(directory),
    queryFn: async (): Promise<ChatSession[]> => {
      const oc = getOcClient();
      const result = await oc.session.list({ directory });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      const data = result.data;

      return data.map(toChatSession);
    },
    enabled: !!directory,
  });
}

/**
 * Global recent sessions across all projects/workspaces, sorted by the
 * opencode server by most-recently-updated. Each item carries a `directory`
 * field that callers can map back to a workspace name. Omits the `directory`
 * parameter so the server returns sessions for every project.
 */
export function useRecentSessions({ limit = 8 }: { limit?: number } = {}) {
  return useQuery({
    queryKey: sessionKeys.recent(limit),
    queryFn: async (): Promise<RecentChatSession[]> => {
      const oc = getOcClient();
      const result = await oc.v2.session.list({ limit });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return (result.data.data ?? []).map(toRecentChatSession);
    },
  });
}

export function useSessionChildren({
  sessionId,
  directory,
}: {
  sessionId: string | null;
  directory?: string;
}) {
  return useQuery({
    queryKey: sessionKeys.children(sessionId ?? ""),
    queryFn: async (): Promise<ChatSession[]> => {
      if (!sessionId) return [];
      const oc = getOcClient();
      const result = await oc.session.children({
        sessionID: sessionId,
        directory,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return (result.data ?? []).map(toChatSession);
    },
    enabled: !!sessionId,
    refetchInterval: CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useSessionStatuses({ directory }: { directory?: string }) {
  return useQuery({
    queryKey: sessionKeys.statuses(directory ?? ""),
    queryFn: async (): Promise<Record<string, SessionRunStatus>> => {
      if (!directory) return {};
      const oc = getOcClient();
      const result = await oc.session.status({ directory });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return Object.fromEntries(
        Object.entries(result.data ?? {}).map(([id, status]) => [
          id,
          toSessionRunStatus(status),
        ]),
      );
    },
    enabled: !!directory,
    refetchInterval: CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
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
    }): Promise<ChatSession> => {
      const oc = getOcClient();
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
      return toChatSession(result.data);
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
    }): Promise<ChatSession> => {
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
      return toChatSession(result.data);
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
    }): Promise<ChatSession> => {
      const oc = getOcClient();
      const result = await oc.session.fork({
        sessionID,
        directory,
        messageID,
      });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return toChatSession(result.data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Record<string, SessionRunStatus>>(
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
