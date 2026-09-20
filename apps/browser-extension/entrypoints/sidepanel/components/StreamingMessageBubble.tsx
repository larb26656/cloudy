import { useStreamingMessagesStore } from "@repo/opencode";
import { MessageBubble } from "@repo/ui/components/message";

interface StreamingMessageBubbleProps {
  sessionId: string;
  messageId: string;
}

export function StreamingMessageBubble({
  sessionId,
  messageId,
}: StreamingMessageBubbleProps) {
  const message = useStreamingMessagesStore((state) =>
    state.streamingMessages.get(sessionId)?.get(messageId),
  );

  if (!message) return null;

  return <MessageBubble message={message} />;
}
