import { MessageBubble } from "./MessageBubble";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";

interface StreamingMessageBubbleProps {
  sessionId: string;
  messageId: string;
}

export function StreamingMessageBubble({
  sessionId,
  messageId,
}: StreamingMessageBubbleProps) {
  const message = useStreamingMessagesStore((s) =>
    s.streamingMessages.get(sessionId)?.get(messageId),
  );

  if (!message) return null;

  return <MessageBubble message={message} />;
}
