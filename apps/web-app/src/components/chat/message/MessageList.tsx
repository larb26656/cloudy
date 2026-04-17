// components/chat/MessageList.tsx
import { useEffect, useRef, useMemo, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/types/message";
import { useStore } from "@/hooks/instanceScopeHook";
import { EmptyChatState } from "../ChatEmptyState";
import { ChevronDown } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import ThinkingAnimation from "./ThinkingAnimation";
import { ChatMinimap } from "../ChatMinimap";

interface MessageListProps {
  selectedSessionId: string | null;
  isShowEmptyState?: boolean;
  showShadowEdge?: boolean;
  onSnippetSelect?: (type: "idea" | "memory" | "artifact") => void;
  showMinimap?: boolean;
  onCloseMinimap?: () => void;
}

export function MessageList({
  selectedSessionId,
  isShowEmptyState = true,
  showShadowEdge = true,
  onSnippetSelect,
  showMinimap = false,
  onCloseMinimap,
}: MessageListProps) {
  const messageStore = useStore("message");
  const isLoading = messageStore.isLoading;
  const error = messageStore.error;
  const loadMessages = messageStore.loadMessages;
  const messagesMap = messageStore.messages;
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const sessionStatuses = useStore("session").sessionStatuses;
  const isBusy = Boolean(
    selectedSessionId && sessionStatuses[selectedSessionId]?.type === "busy",
  );
  const [showScrollButton, setShowScrollButton] = useState(false);

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

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <ErrorState
          message={error}
          onRetry={() => selectedSessionId && loadMessages(selectedSessionId)}
        />
      </div>
    );
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 flex-1 min-h-0 overflow-y-auto p-4 space-y-2 scroll-smooth"
      >
        {messages.length === 0 ? (
          isShowEmptyState && (
            <EmptyChatState onSnippetSelect={onSnippetSelect} />
          )
        ) : (
          <div className="max-w-4xl mx-auto space-y-4 pb-4">
            {messages.map((message: Message) => {
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
                <ThinkingAnimation />
              </div>
            )}
          </div>
        )}
      </div>
      {showShadowEdge && (
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent pointer-events-none" />
      )}
      {showShadowEdge && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      )}
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
      <ChatMinimap
        messages={messages}
        scrollRef={scrollRef}
        isVisible={showMinimap}
        onClose={onCloseMinimap}
      />
    </div>
  );
}
