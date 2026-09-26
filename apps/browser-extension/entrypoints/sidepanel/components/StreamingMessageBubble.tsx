import { useStreamingMessagesStore } from "@repo/opencode";
import { getInjectedContexts } from "../lib/opencode/context";
import { ContextMessageBubble } from "./ContextMessageBubble";
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

  return getInjectedContexts(message).length > 0 ? (
    <ContextMessageBubble message={message} />
  ) : (
    <MessageBubble message={message} />
  );
}
