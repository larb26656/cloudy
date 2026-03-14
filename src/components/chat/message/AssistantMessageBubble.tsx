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
        <div className="flex gap-4">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-primary text-white text-xs font-bold">
              AI
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-3">
            <MessageParts parts={parts} />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-11">
          <span className="text-xs text-muted-foreground">
            {formatTime(info.time.created)}
          </span>

          {info.modelID && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {info.modelID}
            </span>
          )}

          {/* {!isStreaming && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
                title="Copy message"
              >
                {copied ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>

              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onRegenerate}
                  title="Regenerate response"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="More options"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </>
          )} */}
        </div>

        {/* {message.info.tokens && (
          <div className="flex items-center gap-3 ml-11 text-xs text-muted-foreground">
            <span>{message.info.tokens.total} tokens</span>
            {message.info.cost && <span>${message.info.cost.toFixed(4)}</span>}
          </div>
        )} */}
      </div>
    </div>
  );
}
