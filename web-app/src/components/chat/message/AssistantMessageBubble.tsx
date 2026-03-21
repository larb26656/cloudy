import type { Part } from "@opencode-ai/sdk/v2";
import { MessageParts } from "./MessageParts";

interface AssistantMessageBubbleProps {
  info: any;
  parts: Part[];
}

export default function AssistantMessageBubble({
  info,
  parts,
}: AssistantMessageBubbleProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="w-full flex flex-col gap-2 font-content">
        <MessageParts parts={parts} info={info} />
      </div>
    </div>
  );
}
