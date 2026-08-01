import { useMemo, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessageBubble } from "./StreamingMessageBubble";
import type { Message } from "@/types";
import { EmptyChatState } from "../ChatEmptyState";
import ThinkingAnimation from "./ThinkingAnimation";
import { ErrorState } from "@/components/ui/error-state";
import { useMessages } from "@/hooks/queries/useMessages";
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

  const streamingIdSet = useMemo(() => new Set(streamingIds), [streamingIds]);

  const remoteMessages = useMemo(() => data?.pages.flat() ?? [], [data?.pages]);

  const displayMessages = useMemo(
    () => remoteMessages.filter((m) => !streamingIdSet.has(m.info.id)),
    [remoteMessages, streamingIdSet],
  );

  const sessionStatus = selectedSessionId
    ? statuses?.[selectedSessionId]
    : undefined;

  const isStreaming =
    sessionStatus?.type === "busy" || sessionStatus?.type === "retry";

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
    displayMessages.length === 0 &&
    streamingIds.length === 0 &&
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

              {displayMessages.map((message: Message) => (
                <MessageScrollerItem
                  key={message.info.id}
                  messageId={message.info.id}
                  scrollAnchor={message.info.role === "user"}
                >
                  <MessageBubble message={message} isStreaming={false} />
                </MessageScrollerItem>
              ))}

              {selectedSessionId &&
                streamingIds.map((id) => (
                  <MessageScrollerItem key={id} messageId={id}>
                    <StreamingMessageBubble
                      sessionId={selectedSessionId}
                      messageId={id}
                    />
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
                  <div className="mt-2">
                    <ThinkingAnimation />
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
