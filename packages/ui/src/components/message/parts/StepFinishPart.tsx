import type { ChatMessage, StepFinishMessagePart } from "@repo/ai-core";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { formatNumber, formatTime } from "@repo/ui/lib/format";

interface StepFinishPartProps {
  part: StepFinishMessagePart;
  info?: ChatMessage;
}

export function StepFinishPart({ part, info }: StepFinishPartProps) {
  const totalTokens =
    part.tokens.input + part.tokens.output + part.tokens.reasoning;

  const isLastMessage = part.reason === "stop";

  const finishTimestamp = info?.updatedAt
    ? new Date(info.updatedAt).getTime()
    : new Date().getTime();

  if (!isLastMessage) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {finishTimestamp && (
        <span className="text-xs text-muted-foreground">
          {formatTime(finishTimestamp)}
        </span>
      )}

      {part.modelID && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {part.modelID}
        </span>
      )}

      {part.agent && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {part.agent}
        </span>
      )}

      <Tooltip>
        <TooltipTrigger className="inline-flex items-center justify-center rounded-md size-5 hover:bg-muted hover:text-foreground cursor-pointer">
          <Info className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent className="w-auto">
          <div className="space-y-1 text-xs">
            {part.cost > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Cost</span>
                <span>${part.cost.toFixed(6)}</span>
              </div>
            )}
            {totalTokens > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Total Tokens</span>
                <span>{formatNumber(totalTokens)}</span>
              </div>
            )}
            {part.tokens.input > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Input</span>
                <span>{formatNumber(part.tokens.input)}</span>
              </div>
            )}
            {part.tokens.output > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Output</span>
                <span>{formatNumber(part.tokens.output)}</span>
              </div>
            )}
            {part.tokens.reasoning > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Reasoning</span>
                <span>{formatNumber(part.tokens.reasoning)}</span>
              </div>
            )}
            {part.tokens.cache.read > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Cache Read</span>
                <span>{formatNumber(part.tokens.cache.read)}</span>
              </div>
            )}
            {part.tokens.cache.write > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Cache Write</span>
                <span>{formatNumber(part.tokens.cache.write)}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
