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
    return <UserMessageBubble info={message.info} parts={message.parts} />;
  }

  return <AssistantMessageBubble info={message.info} parts={message.parts} />;
}
