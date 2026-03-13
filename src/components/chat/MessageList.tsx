// components/chat/MessageList.tsx
import { useEffect, useRef, useMemo } from "react";
import { MessageBubble } from "./MessageBubble";
import { useMessageStore } from "../../stores/messageStore";
import type { Message } from "../../types";

interface MessageListProps {
  sessionId: string;
}

export function MessageList({ sessionId }: MessageListProps) {
  const messagesMap = useMessageStore((state) => state.messages);
  const streamingMessageIds = useMessageStore(
    (state) => state.streamingMessageIds,
  );
  const isLoading = useMessageStore((state) => state.isLoading);
  const loadMessages = useMessageStore((state) => state.loadMessages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);
  const lastMessageCountRef = useRef(0);

  // Get messages for this session - useMemo to prevent unnecessary re-renders
  const messages = useMemo(
    () => messagesMap[sessionId] || [],
    [messagesMap, sessionId],
  );

  // Load messages when session changes (only once)
  useEffect(() => {
    if (sessionId && messages.length === 0) {
      loadMessages(sessionId);
    }
  }, [sessionId]); // Only depend on sessionId, not loadMessages

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const currentMessageCount = messages.length;
    const hasNewMessages = currentMessageCount > lastMessageCountRef.current;

    if (hasNewMessages && shouldScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    lastMessageCountRef.current = currentMessageCount;
  }, [messages.length]); // Only depend on message count, not the full array

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
        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
          <div className="w-16 h-16 mb-4 bg-gradient-to-br from-blue-400 to-green-400 rounded-2xl flex items-center justify-center">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <p className="text-lg font-medium">Start a conversation</p>
          <p className="text-sm">Send a message to begin chatting</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4 pb-4">
          {messages.map((message: Message) => {
            const isStreaming =
              streamingMessageIds[sessionId] === message.info.id;

            return (
              <MessageBubble
                key={message.info.id}
                message={message}
                isStreaming={isStreaming}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
