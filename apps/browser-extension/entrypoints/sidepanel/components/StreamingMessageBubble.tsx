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
  const displayMessage = message;

  if (!displayMessage) return null;

  return getInjectedContexts(displayMessage).length > 0 ? (
    <ContextMessageBubble message={displayMessage} />
  ) : (
    <MessageBubble message={displayMessage} />
  );
}
