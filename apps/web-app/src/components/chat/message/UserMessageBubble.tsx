import type { UserMessage, Part } from "@opencode-ai/sdk/v2";
import { formatTime } from "@/lib/date";
import { useCopyMessage } from "@/hooks/useCopyMessage";
import { getTextFromParts } from "@/lib/message/text";
import { CopyButton } from "@/components/ui/CopyButton";

interface UserMessageBubbleProps {
  info: UserMessage;
  parts: Part[];
}

export default function UserMessageBubble({
  info,
  parts,
}: UserMessageBubbleProps) {
  const { copied, handleCopy } = useCopyMessage(() => getTextFromParts(parts));

  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[80%] flex flex-col items-end gap-1">
        <div className="relative bg-primary dark:bg-muted text-primary-foreground dark:text-inherit px-4 py-3 rounded-2xl">
          <div className="text-sm whitespace-pre-wrap font-content">
            {getTextFromParts(parts)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatTime(info.time.created)}
          </span>
          <CopyButton onClick={handleCopy} copied={copied} />
        </div>
      </div>
    </div>
  );
}
