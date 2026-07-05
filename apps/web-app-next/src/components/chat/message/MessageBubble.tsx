// components/chat/MessageBubble.tsx

import type { Message } from "@/types/message";
import UserMessageBubble from "./UserMessageBubble";
import AssistantMessageBubble from "./AssistantMessageBubble";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.info.role === "user") {
    return (
      <div data-message-id={message.info.id}>
        <UserMessageBubble info={message.info} parts={message.parts} />
      </div>
    );
  }

  return (
    <div data-message-id={message.info.id}>
      <AssistantMessageBubble info={message.info} parts={message.parts} />
    </div>
  );
}
