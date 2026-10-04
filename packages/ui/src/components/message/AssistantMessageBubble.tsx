import { lazy, Suspense } from "react";
import type { ChatMessage } from "@repo/ai-core";
import { MessageError } from "./MessageError";

const MessageParts = lazy(() =>
  import("./MessageParts").then((module) => ({
    default: module.MessageParts,
  })),
);

interface AssistantMessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function AssistantMessageBubble({
  message,
  isStreaming = false,
}: AssistantMessageBubbleProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="w-full flex flex-col gap-2 font-content">
        <Suspense fallback={null}>
          <MessageParts
            parts={message.parts}
            info={message}
            isStreaming={isStreaming}
          />
        </Suspense>
        {message.error && <MessageError error={message.error} />}
      </div>
    </div>
  );
}
