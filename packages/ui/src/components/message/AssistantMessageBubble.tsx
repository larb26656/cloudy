import { lazy, Suspense } from "react";
import type { AssistantMessage, Part } from "@opencode-ai/sdk/v2";
import { MessageError } from "./MessageError";

const MessageParts = lazy(() =>
  import("./MessageParts").then((module) => ({
    default: module.MessageParts,
  })),
);

interface AssistantMessageBubbleProps {
  info: AssistantMessage;
  parts: Part[];
}

export function AssistantMessageBubble({
  info,
  parts,
}: AssistantMessageBubbleProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="w-full flex flex-col gap-2 font-content">
        <Suspense fallback={null}>
          <MessageParts parts={parts} info={info} />
        </Suspense>
        {info.error && <MessageError error={info.error} />}
      </div>
    </div>
  );
}
