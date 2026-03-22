import type { UserMessage, Part } from "@opencode-ai/sdk/v2";
import { formatTime } from "@/lib/date";

interface UserMessageBubbleProps {
  info: UserMessage;
  parts: Part[];
}

export default function UserMessageBubble({
  info,
  parts,
}: UserMessageBubbleProps) {
  const getTextContent = () => {
    const texts = parts
      .filter((part) => part.type === "text")
      .map((part) => (part as unknown as { text: string }).text);

    if (!texts.length) {
      return "";
    }

    return texts[0];
  };

  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[80%] flex flex-col items-end gap-1">
        <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl">
          <p className="text-sm whitespace-pre-wrap font-content">
            {getTextContent()}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatTime(info.time.created)}
        </span>
      </div>
    </div>
  );
}
