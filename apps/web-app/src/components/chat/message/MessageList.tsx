import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { MessageBubble } from "./MessageBubble";
import { StreamingMessageBubble } from "./StreamingMessageBubble";
import type { Message } from "@/types";
import { EmptyChatState } from "../ChatEmptyState";
import { ChevronDown } from "lucide-react";
import ThinkingAnimation from "./ThinkingAnimation";
import { ErrorState } from "@/components/ui/error-state";
import { useMessages } from "@/hooks/queries/useMessages";
import { useSessionStatuses } from "@/hooks/queries/useSessions";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import { InfiniteScrollContainer } from "@/components/utils/InfiniteScrollContainer";
import { RetryMessage } from "./RetryMessage";

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

  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const hasInitiallyScrolledRef = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    hasInitiallyScrolledRef.current = false;
  }, [selectedSessionId]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior,
        });
      }
    },
    [],
  );

  const handleStreamingScroll = useCallback(() => {
    if (!hasInitiallyScrolledRef.current) {
      hasInitiallyScrolledRef.current = true;
      scrollToBottom("auto");
    } else {
      scrollToBottom("smooth");
    }
  }, [scrollToBottom]);

  useEffect(() => {
    handleStreamingScroll();
  }, [displayMessages, handleStreamingScroll, streamingIds]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      shouldScrollRef.current = isAtBottom;
      setShowScrollButton(!isAtBottom);
    }
  };

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
      <InfiniteScrollContainer
        next={{
          hasMore: hasNextPage,
          isFetching: isFetchingNextPage,
          fetchMore: fetchNextPage,
        }}
        reverse={true}
        scrollRef={scrollRef}
        className="max-w-4xl mx-auto"
        onScroll={handleScroll}
        autoLoad
      >
        {displayMessages.map((message: Message) => (
          <MessageBubble
            key={message.info.id}
            message={message}
            isStreaming={false}
          />
        ))}

        {selectedSessionId &&
          streamingIds.map((id) => (
            <StreamingMessageBubble
              key={id}
              sessionId={selectedSessionId}
              messageId={id}
              onContentChange={handleStreamingScroll}
            />
          ))}

        {sessionStatus?.type === "retry" && (
          <RetryMessage
            attempt={sessionStatus.attempt}
            message={sessionStatus.message}
            next={sessionStatus.next}
          />
        )}

        {isStreaming && (
          <div className="mt-2">
            <ThinkingAnimation />
          </div>
        )}
      </InfiniteScrollContainer>

      {showScrollButton && (
        <div className="absolute bottom-4 mx-auto w-full">
          <button
            onClick={scrollToBottom}
            className="mx-auto w-10 h-10 rounded-full bg-primary dark:bg-muted text-primary-foreground dark:text-muted-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
});
