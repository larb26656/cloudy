import { useEffect, useRef, useMemo, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/types/message";
import { EmptyChatState } from "../ChatEmptyState";
import { ChevronDown } from "lucide-react";
import ThinkingAnimation from "./ThinkingAnimation";
import { ChatMinimap } from "../ChatMinimap";

const now = Date.now();

const MOCK_MESSAGES: Message[] = [
  {
    info: {
      id: "msg-user-1",
      sessionID: "session-mock-0001",
      role: "user",
      time: { created: now - 1000 * 60 * 4 },
      parts: [],
      metadata: {},
    } as any,
    parts: [{ type: "text", text: "Hello! What can cloudy do?" } as any],
  },
  {
    info: {
      id: "msg-assistant-1",
      sessionID: "session-mock-0001",
      role: "assistant",
      agent: "general",
      time: { created: now - 1000 * 60 * 4 + 1000 },
      parts: [],
      metadata: {},
    } as any,
    parts: [
      {
        id: "msg-assistant-1",
        type: "text",
        text: "Hi! This is a **mock response** — the chat UI is wired to inline fixtures, not a real backend yet. Replace via React Query in M4.",
      } as any,
    ],
  },
  {
    info: {
      id: "msg-user-2",
      sessionID: "session-mock-0001",
      role: "user",
      time: { created: now - 1000 * 60 * 3 },
      parts: [],
      metadata: {},
    } as any,
    parts: [
      { type: "text", text: "Sounds good, show me around." } as any,
    ],
  },
  {
    info: {
      id: "msg-assistant-2",
      sessionID: "session-mock-0001",
      role: "assistant",
      agent: "general",
      time: { created: now - 1000 * 60 * 3 + 1000 },
      parts: [],
      metadata: {},
    } as any,
    parts: [
      {
        id: "msg-assistant-2",
        type: "text",
        text: "Try the model picker, agent picker, and command palette (`/`). Sending a message will be a no-op until wire-up.",
      } as any,
    ],
  },
];

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const isBusy = false;
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messages = useMemo(() => {
    if (!selectedSessionId) return [];
    return MOCK_MESSAGES;
  }, [selectedSessionId]);

  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    const scrollToBottom = () => {
      if (!shouldScrollRef.current || !scrollRef.current) return;

      const targetHeight = scrollRef.current.scrollHeight;

      if (targetHeight !== prevMessagesLengthRef.current) {
        prevMessagesLengthRef.current = targetHeight;
        rafId = requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({
            top: targetHeight,
            behavior: "smooth",
          });
        });
      }
    };

    if (messages.length > 0 && messages.length !== prevMessagesLengthRef.current) {
      timeoutId = setTimeout(scrollToBottom, 16);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [messages.length]);

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

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 flex-1 min-h-0 overflow-y-auto p-4 space-y-2 scroll-smooth"
      >
        {messages.length === 0 ? (
          isShowEmptyState && <EmptyChatState onSnippetSelect={onSnippetSelect} />
        ) : (
          <div className="max-w-4xl mx-auto space-y-4 pb-4">
            {messages.map((message: Message) => (
              <MessageBubble
                key={message.info.id}
                message={message}
                isStreaming={false}
              />
            ))}
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
