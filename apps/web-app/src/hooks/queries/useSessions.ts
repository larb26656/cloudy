import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ChatSession as CoreChatSession,
  ModelInfo,
} from "@repo/contracts";
import { providerApi } from "@/lib/cloudy/provider";
import { CHAT_POLL_INTERVAL, messageKeys, sessionKeys } from "@/lib/opencode";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import type { ChatSession, RecentChatSession, SessionRunStatus } from "@/types";

function toChatSession(session: CoreChatSession): ChatSession {
  return {
    id: session.id,
    title: session.title,
    parentID: session.parentId,
    directory: session.directory ?? "",
    updatedAt: Date.parse(session.updatedAt),
    cost: session.cost,
    tokens: session.tokens,
  };
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

async function empty(response: Response): Promise<void> {
  if (!response.ok) throw new Error(await response.text());
}

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
      return toChatSession(
        await json<CoreChatSession>(
          await providerApi.getSession(sessionId, directory),
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
        await json<CoreChatSession[]>(await providerApi.listSessions(directory))
      ).map(toChatSession),
    enabled: !!directory,
  });
}

export function useRecentSessions({ limit = 8 }: { limit?: number } = {}) {
  return useQuery({
    queryKey: sessionKeys.recent(limit),
    queryFn: async (): Promise<RecentChatSession[]> =>
      (
        await json<CoreChatSession[]>(
          await providerApi.listSessions(undefined, limit),
        )
      ).map((session) => ({
        ...toChatSession(session),
        updatedAt: Date.parse(session.updatedAt),
      })),
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
      return (
        await json<CoreChatSession[]>(
          await providerApi.children(sessionId, directory),
        )
      ).map(toChatSession);
    },
    enabled: !!sessionId,
    refetchInterval: CHAT_POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useSessionStatus({ sessionId }: { sessionId: string | null }) {
  return useQuery<SessionRunStatus | undefined>({
    queryKey: sessionKeys.status(sessionId ?? ""),
    queryFn: async () => undefined,
    enabled: false,
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
      model?: ModelInfo;
    }): Promise<ChatSession> =>
      toChatSession(
        await json<CoreChatSession>(
          await providerApi.createSession({
            directory,
            parentId: parentID,
            title,
            agentId: agent,
            model: model
              ? { modelId: model.modelId, providerId: model.providerId }
              : undefined,
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
      directory,
      title,
      metadata,
    }: {
      sessionID: string;
      directory?: string;
      title?: string;
      metadata?: Record<string, unknown>;
    }): Promise<ChatSession> =>
      toChatSession(
        await json<CoreChatSession>(
          await providerApi.updateSession(sessionID, {
            directory,
            title,
            metadata,
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
      directory,
    }: {
      sessionID: string;
      directory?: string;
    }): Promise<void> => {
      await empty(await providerApi.deleteSession(sessionID, directory));
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
      directory,
      messageID,
    }: {
      sessionID: string;
      directory?: string;
      messageID?: string;
    }): Promise<ChatSession> =>
      toChatSession(
        await json<CoreChatSession>(
          await providerApi.fork(sessionID, {
            directory,
            messageId: messageID,
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
