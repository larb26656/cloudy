import { useEffect, useMemo } from "react";
import type { SessionStatus } from "@opencode-ai/sdk/v2";
import type { MessageDisplayItem } from "@repo/ui/components/message";
import { pickFresher, useStreamingMessageDisplayItems } from "@repo/opencode";
import type { Message } from "@/types";
import { useMessages } from "@/hooks/queries/useMessages";
import { useSessionStatuses } from "@/hooks/queries/useSessions";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import { useSessionErrorStore } from "@/stores/sessionErrorStore";
import type { SessionErrorInfo } from "@repo/ui/components/message";

export type { MessageDisplayItem } from "@repo/ui/components/message";

export interface MessageListData {
  remoteMessages: Message[];
  displayItems: MessageDisplayItem[];
  streamingIds: string[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  sessionStatus: SessionStatus | undefined;
  isStreaming: boolean;
  sessionError: SessionErrorInfo | undefined;
  clearError: (sessionId: string) => void;
}

export function useMessageListData({
  selectedSessionId,
  directory,
}: {
  selectedSessionId: string | null;
  directory?: string;
}): MessageListData {
  const removeStreamingMessage = useStreamingMessagesStore(
    (s) => s.removeStreamingMessage,
  );
  const { data: statuses } = useSessionStatuses({ directory });
  const sessionStatus = selectedSessionId
    ? statuses?.[selectedSessionId]
    : undefined;
  const sessionError = useSessionErrorStore((s) =>
    selectedSessionId ? s.errors.get(selectedSessionId) : undefined,
  );
  const clearError = useSessionErrorStore((s) => s.clearError);
  const {
    data,
    isLoading,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessages({
    sessionId: selectedSessionId ?? "",
    statusType: sessionStatus?.type,
  });

  const remoteMessages = useMemo(() => data?.pages.flat() ?? [], [data?.pages]);
  const { displayItems, streamingIds } = useStreamingMessageDisplayItems(
    remoteMessages,
    selectedSessionId,
  );

  // Evict streaming entries that remote has definitively won (finalized, or
  // strictly fresher content). This is the safety net for a `session.idle`
  // event that was missed — under normal flow, `takeSessionStreaming` in the
  // idle handler already clears the store. Runs in an effect to avoid mutating
  // zustand during render.
  useEffect(() => {
    if (!selectedSessionId) return;
    const sessionMap = useStreamingMessagesStore
      .getState()
      .streamingMessages.get(selectedSessionId);
    if (!sessionMap) return;
    for (const [id, streamMsg] of sessionMap) {
      const remoteMsg = remoteMessages.find((m) => m.info.id === id);
      if (remoteMsg && pickFresher(remoteMsg, streamMsg) === "remote") {
        removeStreamingMessage(selectedSessionId, id);
      }
    }
  }, [remoteMessages, streamingIds, selectedSessionId, removeStreamingMessage]);

  const isStreaming =
    sessionStatus?.type === "busy" || sessionStatus?.type === "retry";

  return {
    remoteMessages,
    displayItems,
    streamingIds,
    isLoading,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    sessionStatus,
    isStreaming,
    sessionError,
    clearError,
  };
}
