import { useStreamingMessagesStore } from "@repo/opencode";
import { MessageBubble } from "@repo/ui/components/message";
import { removeInjectedContextParts } from "../lib/opencode/context";

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
  const displayMessage = message ? removeInjectedContextParts(message) : null;

  if (!displayMessage) return null;

  return <MessageBubble message={displayMessage} />;
}
