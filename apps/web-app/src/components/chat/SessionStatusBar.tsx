import { Coins } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "@/hooks/queries/useSessions";
import { formatCompact, formatNumber, formatPercentage } from "@/lib/format";

interface SessionStatusBarProps {
  sessionId: string | null;
  directory: string;
}

interface TokenValues {
  cost: number;
  input: number;
  output: number;
  reasoning: number;
  cacheRead: number;
  cacheWrite: number;
  total: number;
}

function TooltipDetails({ v }: { v: TokenValues }) {
  return (
    <div className="space-y-1 text-xs">
      {v.cost > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Cost</span>
          <span>${v.cost.toFixed(6)}</span>
        </div>
      )}
      {v.total > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Total Tokens</span>
          <span>{formatNumber(v.total)}</span>
        </div>
      )}
      {v.input > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Input</span>
          <span>
            {formatNumber(v.input)} ({formatPercentage(v.input, v.total)})
          </span>
        </div>
      )}
      {v.output > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Output</span>
          <span>
            {formatNumber(v.output)} ({formatPercentage(v.output, v.total)})
          </span>
        </div>
      )}
      {v.reasoning > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Reasoning</span>
          <span>
            {formatNumber(v.reasoning)} ({formatPercentage(v.reasoning, v.total)})
          </span>
        </div>
      )}
      {v.cacheRead > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Cache Read</span>
          <span>{formatNumber(v.cacheRead)}</span>
        </div>
      )}
      {v.cacheWrite > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Cache Write</span>
          <span>{formatNumber(v.cacheWrite)}</span>
        </div>
      )}
    </div>
  );
}

export function SessionStatusBar({
  sessionId,
  directory,
}: SessionStatusBarProps) {
  const { data: session } = useSession({ sessionId, directory });

  if (!session) return null;

  const tokens = session.tokens;
  const cost = session.cost ?? 0;
  const input = tokens?.input ?? 0;
  const output = tokens?.output ?? 0;
  const reasoning = tokens?.reasoning ?? 0;
  const cacheRead = tokens?.cache.read ?? 0;
  const cacheWrite = tokens?.cache.write ?? 0;
  const total = input + output + reasoning;

  if (total === 0 && cost === 0) return null;

  const v: TokenValues = {
    cost,
    input,
    output,
    reasoning,
    cacheRead,
    cacheWrite,
    total,
  };

  return (
    <div className="px-4 pb-1">
      <div className="max-w-4xl mx-auto text-xs text-muted-foreground">
        {/* Desktop (sm+): cost left + tokens right */}
        <div className="hidden sm:flex items-center gap-2">
          {cost > 0 && (
            <Tooltip>
              <TooltipTrigger className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
                <Coins className="size-3" />
                <span>${cost.toFixed(6)}</span>
              </TooltipTrigger>
              <TooltipContent className="w-auto">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Cost</span>
                    <span>${cost.toFixed(6)}</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {total > 0 && (
            <div className="flex-1 flex justify-end items-center gap-1.5">
              {input > 0 && (
                <Tooltip>
                  <TooltipTrigger className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors cursor-pointer">
                    <span>In</span>
                    <span className="tabular-nums">
                      {formatCompact(input)} ({formatPercentage(input, total)})
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="w-auto">
                    <TooltipDetails v={v} />
                  </TooltipContent>
                </Tooltip>
              )}
              {output > 0 && (
                <>
                  <span>·</span>
                  <Tooltip>
                    <TooltipTrigger className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors cursor-pointer">
                      <span>Out</span>
                      <span className="tabular-nums">
                        {formatCompact(output)} ({formatPercentage(output, total)})
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="w-auto">
                      <TooltipDetails v={v} />
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
              {reasoning > 0 && (
                <>
                  <span>·</span>
                  <Tooltip>
                    <TooltipTrigger className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors cursor-pointer">
                      <span>Reason</span>
                      <span className="tabular-nums">
                        {formatCompact(reasoning)} ({formatPercentage(reasoning, total)})
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="w-auto">
                      <TooltipDetails v={v} />
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
              {(cacheRead > 0 || cacheWrite > 0) && (
                <>
                  <span>·</span>
                  <Tooltip>
                    <TooltipTrigger className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors cursor-pointer">
                      <span>Cache</span>
                      <span className="tabular-nums">
                        {formatCompact(cacheRead + cacheWrite)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="w-auto">
                      <TooltipDetails v={v} />
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile (< sm): total tokens only, full breakdown in tooltip */}
        <div className="flex sm:hidden justify-center">
          <div>
            <Coins className="size-3" />
            <span>${cost.toFixed(6)}</span>
          </div>
          <div className="flex-1"></div>
          <Tooltip>
            <TooltipTrigger className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
              {total > 0 && (
                <span className="tabular-nums">
                  {formatCompact(total)} tokens
                </span>
              )}
            </TooltipTrigger>
            <TooltipContent className="w-auto">
              <TooltipDetails v={v} />
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
