import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ChatSession as CoreChatSession,
  ModelInfo,
} from "@repo/contracts";
import { cloudyClient } from "@/lib/api";
import { emptyResponse, jsonResponse } from "@/lib/api-response";
import { CHAT_POLL_INTERVAL, messageKeys, sessionKeys } from "@/lib/opencode";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import type { ChatSession, RecentChatSession, SessionRunStatus } from "@/types";

function toChatSession(session: CoreChatSession): ChatSession {
  return {
    agentId: session.agent?.id,
    id: session.id,
    providerId: session.providerId,
    title: session.title,
    parentID: session.parentId,
    directory: session.directory ?? "",
    status: typeof session.status === "string" ? session.status : "retry",
    runStatus: session.runStatus,
    updatedAt: Date.parse(session.updatedAt),
    cost: session.cost,
    tokens: session.tokens,
    origin: session.origin,
  };
}

export function useSession({
  sessionId,
}: {
  sessionId: string | null;
  directory?: string;
}) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId ?? ""),
    queryFn: async (): Promise<ChatSession | null> => {
      if (!sessionId) return null;
      return toChatSession(
        await jsonResponse<CoreChatSession>(
          await cloudyClient.api.sessions[":sessionId"].$get({
            param: { sessionId },
          }),
        ),
      );
    },
    enabled: !!sessionId,
    refetchInterval: CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useSessions({ directory }: { directory: string }) {
  return useQuery({
    queryKey: sessionKeys.infinite(directory),
    queryFn: async (): Promise<ChatSession[]> =>
      (
        await jsonResponse<CoreChatSession[]>(
          await cloudyClient.api.sessions.$get({ query: { directory } }),
        )
      ).map(toChatSession),
    enabled: !!directory,
  });
}

export function useRecentSessions({
  limit = 8,
  search,
}: { limit?: number; search?: string } = {}) {
  return useQuery({
    queryKey: [...sessionKeys.recent(limit), search],
    queryFn: async (): Promise<RecentChatSession[]> =>
      (
        await jsonResponse<CoreChatSession[]>(
          await cloudyClient.api.sessions.$get({
            query: { limit: String(limit), search },
          }),
        )
      ).map((session) => ({
        ...toChatSession(session),
        updatedAt: Date.parse(session.updatedAt),
      })),
    placeholderData: (previousData) => previousData,
  });
}

export function useSessionChildren({
  sessionId,
}: {
  sessionId: string | null;
  directory?: string;
}) {
  return useQuery({
    queryKey: sessionKeys.children(sessionId ?? ""),
    queryFn: async (): Promise<ChatSession[]> => {
      if (!sessionId) return [];
      return (
        await jsonResponse<CoreChatSession[]>(
          await cloudyClient.api.sessions[":sessionId"].children.$get({
            param: { sessionId },
          }),
        )
      ).map(toChatSession);
    },
    enabled: !!sessionId,
    refetchInterval: CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useSessionStatus({
  sessionId,
}: {
  sessionId: string | null;
  directory?: string;
}) {
  return useQuery<SessionRunStatus | undefined>({
    queryKey: sessionKeys.status(sessionId ?? ""),
    queryFn: async () => {
      if (!sessionId) return undefined;
      const status = await jsonResponse<"running" | "queued" | "idle">(
        await cloudyClient.api.sessions[":sessionId"].status.$get({
          param: { sessionId },
        }),
      );
      if (status === "running") return { type: "busy" };
      if (status === "queued")
        return { type: "retry", attempt: 0, message: "", next: 0 };
      return { type: "idle" };
    },
    enabled: !!sessionId,
    refetchInterval: CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      directory,
      providerId,
      parentID,
      title,
      agent,
      model,
      transferContext,
    }: {
      directory?: string;
      providerId?: string;
      parentID?: string;
      title?: string;
      agent?: string;
      model?: ModelInfo;
      transferContext?: {
        summary: string;
        files: string[];
        diff: string;
        task: string;
        unresolvedQuestions: string[];
      };
    }): Promise<ChatSession> =>
      toChatSession(
        await jsonResponse<CoreChatSession>(
          await cloudyClient.api.sessions.$post({
            json: {
              directory,
              providerId,
              parentId: parentID,
              title,
              agentId: agent,
              model: model
                ? { modelId: model.modelId, providerId: model.providerId }
                : undefined,
              metadata: transferContext,
            },
          }),
        ),
      ),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.root() });
      void queryClient.invalidateQueries({
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
      title,
      metadata,
    }: {
      sessionID: string;
      directory?: string;
      title?: string;
      metadata?: Record<string, unknown>;
    }): Promise<ChatSession> =>
      toChatSession(
        await jsonResponse<CoreChatSession>(
          await cloudyClient.api.sessions[":sessionId"].$patch({
            param: { sessionId: sessionID },
            json: {
              title,
              metadata,
            },
          }),
        ),
      ),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.root() });
      void queryClient.invalidateQueries({
        queryKey: sessionKeys.infinite(data.directory),
      });
      void queryClient.invalidateQueries({
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
    }: {
      sessionID: string;
      directory?: string;
    }): Promise<void> => {
      await emptyResponse(
        await cloudyClient.api.sessions[":sessionId"].$delete({
          param: { sessionId: sessionID },
        }),
      );
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.root() });
      if (variables.directory)
        void queryClient.invalidateQueries({
          queryKey: sessionKeys.infinite(variables.directory),
        });
    },
  });
}

export function useForkSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionID,
      messageID,
    }: {
      sessionID: string;
      directory?: string;
      messageID?: string;
    }): Promise<ChatSession> =>
      toChatSession(
        await jsonResponse<CoreChatSession>(
          await cloudyClient.api.sessions[":sessionId"].fork.$post({
            param: { sessionId: sessionID },
            json: {
              messageId: messageID,
            },
          }),
        ),
      ),
    onSuccess: (data) => {
      queryClient.setQueryData<SessionRunStatus>(sessionKeys.status(data.id), {
        type: "idle",
      });
      useStreamingMessagesStore.getState().takeSessionStreaming(data.id);
      void queryClient.invalidateQueries({
        queryKey: messageKeys.infinite(data.id),
      });
      void queryClient.invalidateQueries({ queryKey: sessionKeys.root() });
      void queryClient.invalidateQueries({
        queryKey: sessionKeys.infinite(data.directory),
      });
    },
  });
}
