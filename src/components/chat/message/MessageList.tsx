// components/chat/MessageList.tsx
import { useEffect, useRef, useMemo } from "react";
import { MessageBubble } from "./MessageBubble";
import type { MessageV2 } from "@/types/messagev2";
import { useMessageStore, useSessionStore } from "@/stores";
import { EmptyChatState } from "../ChatEmptyState";

interface MessageListProps {}

export function MessageList({}: MessageListProps) {
  const isLoading = useMessageStore((state) => state.isLoading);
  const messagesMap = useMessageStore((state) => state.messages);
  const selectedSessionId = useSessionStore((s) => s.selectedSessionId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const sessionStatuses = useSessionStore((s) => s.sessionStatuses);
  const isBusy = Boolean(
    selectedSessionId && sessionStatuses[selectedSessionId]?.type === "busy",
  );

  const messages = useMemo(() => {
    if (!selectedSessionId) {
      return [];
    }
    return messagesMap[selectedSessionId] || [];
  }, [messagesMap, selectedSessionId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (shouldScrollRef.current && scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Handle scroll - pause auto-scroll if user scrolls up
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      shouldScrollRef.current = isAtBottom;
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <div className="w-48 h-4 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 scroll-smooth"
    >
      {messages.length === 0 ? (
        <EmptyChatState />
      ) : (
        <div className="max-w-4xl mx-auto space-y-4 pb-4">
          {messages.map((message: MessageV2) => {
            return (
              <MessageBubble
                key={message.info.id}
                message={message}
                isStreaming={false}
              />
            );
          })}
          {isBusy && (
            <div className="mt-2">
              <ThinkingAnimation />{" "}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-1 h-6">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
    </div>
  );
}
