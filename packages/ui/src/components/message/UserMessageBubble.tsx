import type { ChatMessage } from "@repo/ai-core";
import { useCopyMessage } from "@repo/ui/hooks/use-copy-message";
import { formatTime } from "@repo/ui/lib/format";
import { getTextFromParts } from "@repo/ui/lib/message-text";
import { CopyButton } from "@repo/ui/components/CopyButton";

interface UserMessageBubbleProps {
  message: ChatMessage;
}

export function UserMessageBubble({ message }: UserMessageBubbleProps) {
  const { copied, handleCopy } = useCopyMessage(() =>
    getTextFromParts(message.parts),
  );

  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[80%] flex flex-col items-end gap-1">
        <div className="relative bg-primary dark:bg-muted text-primary-foreground dark:text-inherit px-4 py-3 rounded-2xl">
          <div className="text-sm whitespace-pre-wrap font-content wrap-anywhere">
            {getTextFromParts(message.parts)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatTime(new Date(message.createdAt).getTime())}
          </span>
          <CopyButton onClick={handleCopy} copied={copied} />
        </div>
      </div>
    </div>
  );
}
