import { useEffect, useMemo, useRef, useState, memo } from "react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/types";
import { EmptyChatState } from "../ChatEmptyState";
import { ChevronDown } from "lucide-react";
import ThinkingAnimation from "./ThinkingAnimation";
import { ErrorState } from "@/components/ui/error-state";
import { useMessages } from "@/hooks/queries/useMessages";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import { InfiniteScrollContainer } from "@/components/utils/InfiniteScrollContainer";

interface MessageListProps {
  selectedSessionId: string | null;
  isShowEmptyState?: boolean;
  onSnippetSelect?: (type: "idea" | "memory" | "artifact") => void;
}

export const MessageList = memo(function MessageList({
  selectedSessionId,
  isShowEmptyState = true,
  onSnippetSelect,
}: MessageListProps) {
  const { streamingMessages } = useStreamingMessagesStore();
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

  const sessionStreaming = useMemo(() => {
    return selectedSessionId
      ? Array.from(streamingMessages.get(selectedSessionId)?.values() ?? [])
      : [];
  }, [streamingMessages, selectedSessionId]);

  const remoteMessages = useMemo(
    () => data?.pages.reverse().flat() ?? [],
    [data?.pages],
  );

  const allMessages = useMemo(() => {
    const map = new Map<string, Message>();

    for (const msg of remoteMessages) {
      map.set(msg.info.id, msg);
    }

    for (const msg of sessionStreaming) {
      map.set(msg.info.id, msg);
    }

    return Array.from(map.values());
  }, [remoteMessages, sessionStreaming]);

  const isStreaming = sessionStreaming.length > 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    if (shouldScrollRef.current) {
      scrollToBottom();
    }
  }, [allMessages]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      shouldScrollRef.current = isAtBottom;
      setShowScrollButton(!isAtBottom);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
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

  if (allMessages.length === 0 && isShowEmptyState) {
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
        {allMessages.map((message: Message) => (
          <MessageBubble
            key={message.info.id}
            message={message}
            isStreaming={false}
          />
        ))}

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
