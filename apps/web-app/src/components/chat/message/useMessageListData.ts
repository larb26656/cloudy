import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { SessionStatus } from "@opencode-ai/sdk/v2";
import type { MessageDisplayItem } from "@repo/ui/components/message";
import { pickFresher } from "@repo/opencode";
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
  const streamingIds = useStreamingMessagesStore(
    useShallow((s) => {
      const map = s.streamingMessages.get(selectedSessionId ?? "");
      return map ? Array.from(map.keys()) : [];
    }),
  );
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

  // `streamingIds` is shallow-stable across text-only deltas (it only changes
  // when a message id is added/removed), so selecting just the ids keeps this
  // component from re-rendering on every token — the per-id `StreamingMessageBubble`
  // subscribes to the store itself and handles its own live updates.
  // The freshness decision below reads the streaming `Message` objects via
  // `getState()` inside the memo; that is correct because the decision only
  // needs to refresh when the structure (streamingIds) or the remote cache
  // changes, both of which are memo deps. Between those events the winner
  // cannot flip: a streaming copy that is currently fresher only keeps growing.

  // Unified, deduped list of message ids to render. For each id we pick the
  // fresher of (remote cache, streaming store) via `pickFresher` so that a
  // mid-stream `useMessages` refetch returning a partial server snapshot of an
  // assistant message never freezes the bubble on stale content. Rendering the
  // remote and streaming copies as a single keyed list (keyed by message id,
  // regardless of `kind`) keeps the same `MessageScrollerItem` DOM node alive
  // across the streaming -> remote transition, so the scroller's content
  // childList does not mutate on swap and its anchor-detection logic never
  // misfires.
  const displayItems = useMemo(() => {
    const sessionId = selectedSessionId ?? "";
    const streamMap = useStreamingMessagesStore
      .getState()
      .streamingMessages.get(sessionId);

    const items: MessageDisplayItem[] = [];

    for (const m of remoteMessages) {
      const stream = streamMap?.get(m.info.id);
      if (stream && pickFresher(m, stream) === "streaming") {
        items.push({ id: m.info.id, kind: "streaming" });
      } else {
        items.push({ id: m.info.id, kind: "remote", message: m });
      }
    }

    // Append ids that only exist in the streaming store (not yet in remote).
    for (const id of streamingIds) {
      if (!remoteMessages.some((m) => m.info.id === id)) {
        items.push({ id, kind: "streaming" });
      }
    }

    return items;
  }, [remoteMessages, streamingIds, selectedSessionId]);

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
