import type { Part } from "@opencode-ai/sdk/v2";
import { MessageParts } from "./MessageParts";
import { useMessageStoreV2 } from "@/stores/messageStoreV2";

interface AssistantMessageBubbleProps {
  info: any;
  parts: Part[];
}

export default function AssistantMessageBubble({
  info,
  parts,
}: AssistantMessageBubbleProps) {
  const isThinking = useMessageStoreV2((state) => state.isThinking);
  const hasContent =
    parts.length > 0 && parts.some((p) => "text" in p && p.text.length > 0);

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] flex flex-col gap-2">
        <div className="flex flex-col gap-3 font-content">
          <MessageParts parts={parts} info={info} />

          {!hasContent && isThinking && <ThinkingAnimation />}
        </div>
      </div>
    </div>
  );
}

function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-1 h-6">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
    </div>
  );
}
