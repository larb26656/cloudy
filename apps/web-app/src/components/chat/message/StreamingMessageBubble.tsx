import { useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";

interface StreamingMessageBubbleProps {
  sessionId: string;
  messageId: string;
  onContentChange?: () => void;
}

export function StreamingMessageBubble({
  sessionId,
  messageId,
  onContentChange,
}: StreamingMessageBubbleProps) {
  const message = useStreamingMessagesStore((s) =>
    s.streamingMessages.get(sessionId)?.get(messageId),
  );

  useEffect(() => {
    onContentChange?.();
  }, [message, onContentChange]);

  if (!message) return null;

  return <MessageBubble message={message} />;
}
