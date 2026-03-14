import type { AssistantMessage, Part } from "@opencode-ai/sdk/v2";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { MessageParts } from "./MessageParts";

interface AssistantMessageBubbleProps {
  info: AssistantMessage;
  parts: Part[];
}

export default function AssistantMessageBubble({
  info,
  parts,
}: AssistantMessageBubbleProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] flex flex-col gap-2">
        <div className="flex flex-col gap-3 font-content">
          <MessageParts parts={parts} info={info} />
        </div>
      </div>
    </div>
  );
}
