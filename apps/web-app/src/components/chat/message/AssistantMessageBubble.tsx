import type { AssistantMessage, Part } from "@opencode-ai/sdk/v2";
import { MessageParts } from "./MessageParts";
import { MessageError } from "./MessageError";

interface AssistantMessageBubbleProps {
  info: AssistantMessage;
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
        {info.error && <MessageError error={info.error} />}
      </div>
    </div>
  );
}
