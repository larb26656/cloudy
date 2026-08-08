import { memo } from "react";
import { Coins } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PathText } from "@/components/ui/path-text";
import { WorkspaceBadge } from "@/components/workspace/WorkspaceBadge";
import { useSession } from "@/hooks/queries/useSessions";
import { formatCompact, formatNumber, formatPercentage } from "@/lib/format";
import type { Workspace } from "@/lib/cloudy/workspaces";

interface SessionStatusBarProps {
  sessionId: string | null;
  directory: string;
  workspace?: Workspace | null;
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
            {formatNumber(v.reasoning)} (
            {formatPercentage(v.reasoning, v.total)})
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

export const SessionStatusBar = memo(function SessionStatusBar({
  sessionId,
  directory,
  workspace = null,
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
    <div className="@container px-4 pb-1">
      <div className="max-w-4xl mx-auto text-xs text-muted-foreground">
        {/* Wide (>=40rem container): directory+badge left, cost+tokens right */}
        <div className="hidden @[40rem]:flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {workspace && (
              <WorkspaceBadge
                workspaceName={workspace.name}
                directory={directory}
                workspaceId={workspace.id}
              />
            )}
            <PathText path={directory} />
          </div>

          {cost > 0 && (
            <div className="flex shrink-0 items-center gap-1">
              <Coins className="size-3" />
              <span>${cost.toFixed(6)}</span>
            </div>
          )}

          {total > 0 && (
            <div className="flex shrink-0 items-center gap-1.5">
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
                        {formatCompact(output)} (
                        {formatPercentage(output, total)})
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
                        {formatCompact(reasoning)} (
                        {formatPercentage(reasoning, total)})
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

        {/* Narrow (<40rem container): directory+badge left, cost+total right */}
        <div className="flex @[40rem]:hidden items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {workspace && (
              <WorkspaceBadge
                workspaceName={workspace.name}
                directory={directory}
                workspaceId={workspace.id}
              />
            )}
            <PathText path={directory} />
          </div>

          {cost > 0 && (
            <div className="flex shrink-0 items-center gap-1">
              <Coins className="size-3" />
              <span>${cost.toFixed(6)}</span>
            </div>
          )}

          {total > 0 && (
            <Tooltip>
              <TooltipTrigger className="shrink-0 inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
                <span className="tabular-nums">
                  {formatCompact(total)} tokens
                </span>
              </TooltipTrigger>
              <TooltipContent className="w-auto">
                <TooltipDetails v={v} />
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
});
