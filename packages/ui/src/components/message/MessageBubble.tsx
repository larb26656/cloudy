import { memo } from "react";
import type { Message } from "@repo/ui/components/message/types";
import { UserMessageBubble } from "./UserMessageBubble";
import { AssistantMessageBubble } from "./AssistantMessageBubble";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isStreaming = false,
}: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div data-message-id={message.id}>
        <UserMessageBubble message={message} />
      </div>
    );
  }

  return (
    <div data-message-id={message.id}>
      <AssistantMessageBubble message={message} isStreaming={isStreaming} />
    </div>
  );
});
