import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { SessionStatus } from "@opencode-ai/sdk/v2";
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
import { RetryMessage } from "./RetryMessage";

type RetryStatus = Extract<SessionStatus, { type: "retry" }>;

type ChatListItem =
  | { kind: "message"; key: string; message: Message }
  | {
      kind: "streaming";
      key: string;
      sessionId: string;
      messageId: string;
    }
  | { kind: "retry"; key: "retry"; status: RetryStatus }
  | { kind: "thinking"; key: "thinking" };

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
  const { data, isLoading, error, refetch } = useMessages({
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

  const retryStatus =
    sessionStatus?.type === "retry" ? sessionStatus : undefined;

  const items = useMemo<ChatListItem[]>(() => {
    const result: ChatListItem[] = displayMessages.map((message) => ({
      kind: "message",
      key: message.info.id,
      message,
    }));

    if (selectedSessionId) {
      for (const id of streamingIds) {
        result.push({
          kind: "streaming",
          key: id,
          sessionId: selectedSessionId,
          messageId: id,
        });
      }
    }
    if (retryStatus) {
      result.push({ kind: "retry", key: "retry", status: retryStatus });
    }
    if (isStreaming) {
      result.push({ kind: "thinking", key: "thinking" });
    }
    return result;
  }, [
    displayMessages,
    streamingIds,
    selectedSessionId,
    retryStatus,
    isStreaming,
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 160,
    overscan: 6,
    getItemKey: (index) => items[index]?.key ?? `empty-${index}`,
  });

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const scrollToBottomIfStuck = useCallback(() => {
    if (!stickToBottomRef.current) return;
    scrollToBottom("instant");
  }, [scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    stickToBottomRef.current = isAtBottom;
    setShowScrollButton(!isAtBottom);
  }, []);

  const virtualItems = rowVirtualizer.getVirtualItems();

  // --- Stick-to-bottom when new items appear (e.g. streaming starts) ---
  useEffect(() => {
    if (!stickToBottomRef.current) return;
    rowVirtualizer.scrollToIndex(items.length - 1, {
      align: "end",
      behavior: "instant",
    });
  }, [items, rowVirtualizer]);

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

  const renderRow = (item: ChatListItem) => {
    switch (item.kind) {
      case "message":
        return <MessageBubble message={item.message} isStreaming={false} />;
      case "streaming":
        return (
          <StreamingMessageBubble
            sessionId={item.sessionId}
            messageId={item.messageId}
            onContentChange={scrollToBottomIfStuck}
          />
        );
      case "retry":
        return (
          <RetryMessage
            attempt={item.status.attempt}
            message={item.status.message}
            next={item.status.next}
          />
        );
      case "thinking":
        return (
          <div className="mt-2">
            <ThinkingAnimation />
          </div>
        );
    }
  };

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4"
      >
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            position: "relative",
          }}
          className="max-w-4xl mx-auto"
        >
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index];
            if (!item) return null;
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div>{renderRow(item)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {showScrollButton && (
        <div className="absolute bottom-4 mx-auto w-full">
          <button
            onClick={() => scrollToBottom("smooth")}
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
