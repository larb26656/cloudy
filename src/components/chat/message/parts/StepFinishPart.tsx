import type {
  StepFinishPart as StepFinishPartType,
  AssistantMessage,
} from "@opencode-ai/sdk/v2";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StepFinishPartProps {
  part: StepFinishPartType;
  info?: AssistantMessage;
}

export function StepFinishPart({ part, info }: StepFinishPartProps) {
  const formatNumber = (num: number) => num.toLocaleString();
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalTokens =
    part.tokens.input + part.tokens.output + part.tokens.reasoning;

  const completedTime = new Date().getTime();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {formatTime(completedTime)}
        </span>

        {info?.modelID && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {info.modelID}
          </span>
        )}

        {info?.agent && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {info.agent}
          </span>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="size-3.5 text-muted-foreground cursor-pointer hover:text-foreground" />
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
    </div>
  );
}
