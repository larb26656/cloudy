import { useMemo, memo, useEffect, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { Square } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessageBubble } from "./StreamingMessageBubble";
import type { Message } from "@/types";
import { EmptyChatState } from "../ChatEmptyState";
import ThinkingAnimation from "./ThinkingAnimation";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { useMessages, useAbortGeneration } from "@/hooks/queries/useMessages";
import { useSessionStatuses } from "@/hooks/queries/useSessions";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import { IsVisible } from "@/components/utils/IsVisible";
import { RetryMessage } from "./RetryMessage";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";

interface MessageListProps {
  selectedSessionId: string | null;
  directory?: string;
  isShowEmptyState?: boolean;
  onSnippetSelect?: (type: "idea" | "memory" | "artifact") => void;
}

export const MessageList = memo(function MessageList({
  selectedSessionId,
  directory,
  isShowEmptyState = true,
  onSnippetSelect,
}: MessageListProps) {
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
  });

  const remoteMessages = useMemo(() => data?.pages.flat() ?? [], [data?.pages]);

  const remoteIdSet = useMemo(
    () => new Set(remoteMessages.map((m) => m.info.id)),
    [remoteMessages],
  );

  const activeStreamingIds = useMemo(
    () => streamingIds.filter((id) => !remoteIdSet.has(id)),
    [streamingIds, remoteIdSet],
  );

  // Unified, deduped list of message ids to render. A message id is either
  // present in the remote cache (source of truth once streaming ends) or in the
  // streaming store, never both (activeStreamingIds already excludes ids that
  // landed in remoteIdSet). Rendering them as a single keyed list keeps the
  // same `MessageScrollerItem` DOM node alive across the streaming -> remote
  // transition, so the scroller's content childList does not mutate on swap and
  // its anchor-detection logic (which would otherwise treat the user message's
  // freshly-enabled scrollAnchor as a brand-new anchor and jump to it) never
  // fires.
  const displayItems = useMemo(() => {
    const items: Array<
      | { id: string; kind: "remote"; message: Message }
      | { id: string; kind: "streaming" }
    > = remoteMessages.map((m) => ({
      id: m.info.id,
      kind: "remote" as const,
      message: m,
    }));
    for (const id of activeStreamingIds) {
      items.push({ id, kind: "streaming" as const });
    }
    return items;
  }, [remoteMessages, activeStreamingIds]);

  // Evict stale streaming entries: if a message id is present in both the
  // streaming store and the remote data, the stream is done but wasn't cleared
  // (e.g. session.idle never fired). Remove it from the store so remote — the
  // source of truth — is shown and the store doesn't leak. Runs in an effect
  // to avoid mutating zustand during render.
  useEffect(() => {
    if (!selectedSessionId) return;
    for (const id of streamingIds) {
      if (remoteIdSet.has(id)) {
        removeStreamingMessage(selectedSessionId, id);
      }
    }
  }, [streamingIds, remoteIdSet, selectedSessionId, removeStreamingMessage]);

  const sessionStatus = selectedSessionId
    ? statuses?.[selectedSessionId]
    : undefined;

  const isStreaming =
    sessionStatus?.type === "busy" || sessionStatus?.type === "retry";

  const { mutate: abortMutate, isPending: isAborting } = useAbortGeneration();

  const handleAbort = useCallback(() => {
    if (selectedSessionId && directory && !isAborting) {
      abortMutate({ sessionId: selectedSessionId, directory });
    }
  }, [selectedSessionId, directory, isAborting, abortMutate]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <div className="w-48 h-4 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  if (
    remoteMessages.length === 0 &&
    activeStreamingIds.length === 0 &&
    isShowEmptyState
  ) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyChatState onSnippetSelect={onSnippetSelect} />
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0">
      <MessageScrollerProvider autoScroll>
        <MessageScroller className="h-full">
          <MessageScrollerViewport>
            <MessageScrollerContent
              aria-busy={isStreaming}
              className="mx-auto w-full max-w-4xl gap-0 p-4"
            >
              {hasNextPage && (
                <div className="self-center py-2">
                  {isFetchingNextPage ? (
                    <span className="text-sm text-muted-foreground">
                      Loading…
                    </span>
                  ) : (
                    <IsVisible onVisible={() => fetchNextPage()} />
                  )}
                </div>
              )}

              {displayItems.map((item) => (
                <MessageScrollerItem
                  key={item.id}
                  messageId={item.id}
                  scrollAnchor={
                    item.kind === "remote" && item.message.info.role === "user"
                  }
                >
                  {item.kind === "remote" ? (
                    <MessageBubble message={item.message} isStreaming={false} />
                  ) : (
                    <StreamingMessageBubble
                      sessionId={selectedSessionId ?? ""}
                      messageId={item.id}
                    />
                  )}
                </MessageScrollerItem>
              ))}

              {sessionStatus?.type === "retry" && (
                <MessageScrollerItem messageId="__retry">
                  <RetryMessage
                    attempt={sessionStatus.attempt}
                    message={sessionStatus.message}
                    next={sessionStatus.next}
                  />
                </MessageScrollerItem>
              )}

              {isStreaming && (
                <MessageScrollerItem messageId="__thinking">
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <ThinkingAnimation />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAbort}
                      disabled={isAborting}
                      title="Stop generating"
                    >
                      <Square className="size-4" />
                    </Button>
                  </div>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
});
