import { useMemo } from "react";
import { useModelStore, useMessageStore, useSessionStore } from "@/stores";
import { formatNumber } from "@/lib/date";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TokenUsageIndicatorProps {
  sessionId?: string | null;
}

export function TokenUsageIndicator({ sessionId }: TokenUsageIndicatorProps) {
  const { selectedModel } = useModelStore();
  const { messages } = useMessageStore();
  const { selectedSessionId } = useSessionStore();

  const { totalTokens, totalCost, inputTokens, outputTokens, reasoningTokens, cacheReadTokens, cacheWriteTokens, percent, sessionIdToUse } = useMemo(() => {
    const currentSessionId = sessionId ?? selectedSessionId;
    const msgs = currentSessionId ? messages[currentSessionId] : [];

    if (!msgs || msgs.length === 0) {
      return {
        totalTokens: 0,
        totalCost: 0,
        inputTokens: 0,
        outputTokens: 0,
        reasoningTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        percent: 0,
        sessionIdToUse: currentSessionId,
      };
    }

    let input = 0;
    let output = 0;
    let reasoning = 0;
    let cacheRead = 0;
    let cacheWrite = 0;
    let cost = 0;

    for (const msg of msgs) {
      for (const part of msg.parts) {
        if (part.type === "step-finish") {
          input += part.tokens.input;
          output += part.tokens.output;
          reasoning += part.tokens.reasoning;
          cacheRead += part.tokens.cache.read;
          cacheWrite += part.tokens.cache.write;
          cost += part.cost;
        }
      }
    }

    const total = input + output + reasoning;
    const maxTokens = selectedModel?.maxTokens ?? 0;
    const pct = maxTokens > 0 ? Math.min((total / maxTokens) * 100, 100) : 0;

    return {
      totalTokens: total,
      totalCost: cost,
      inputTokens: input,
      outputTokens: output,
      reasoningTokens: reasoning,
      cacheReadTokens: cacheRead,
      cacheWriteTokens: cacheWrite,
      percent: pct,
      sessionIdToUse: currentSessionId,
    };
  }, [sessionId, selectedSessionId, messages, selectedModel]);

  if (!sessionIdToUse || totalTokens === 0) {
    return null;
  }

  const size = 20;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <Tooltip>
      <TooltipTrigger>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 cursor-default text-primary"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted-foreground/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
      </TooltipTrigger>
      <TooltipContent className="w-auto">
        <div className="space-y-1.5 text-xs">
          <div className="font-semibold text-foreground mb-2">
            Token Usage
          </div>
          {totalCost > 0 && (
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Total Cost</span>
              <span className="font-medium">${totalCost.toFixed(6)}</span>
            </div>
          )}
          <div className="flex justify-between gap-8">
            <span className="text-muted-foreground">Total Tokens</span>
            <span className="font-medium">{formatNumber(totalTokens)}</span>
          </div>
          {inputTokens > 0 && (
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Input</span>
              <span className="font-medium">{formatNumber(inputTokens)}</span>
            </div>
          )}
          {outputTokens > 0 && (
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Output</span>
              <span className="font-medium">{formatNumber(outputTokens)}</span>
            </div>
          )}
          {reasoningTokens > 0 && (
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Reasoning</span>
              <span className="font-medium">{formatNumber(reasoningTokens)}</span>
            </div>
          )}
          {cacheReadTokens > 0 && (
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Cache Read</span>
              <span className="font-medium">{formatNumber(cacheReadTokens)}</span>
            </div>
          )}
          {cacheWriteTokens > 0 && (
            <div className="flex justify-between gap-8">
              <span className="text-muted-foreground">Cache Write</span>
              <span className="font-medium">{formatNumber(cacheWriteTokens)}</span>
            </div>
          )}
          {selectedModel && (
            <>
              <div className="border-t border-border my-1" />
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">Model Limit</span>
                <span className="font-medium">{formatNumber(selectedModel.maxTokens ?? 0)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">Session Model</span>
                <span className="font-medium">{selectedModel.name}</span>
              </div>
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
