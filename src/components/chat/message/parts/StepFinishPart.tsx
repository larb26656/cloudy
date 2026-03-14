import type { StepFinishPart as StepFinishPartType } from "@opencode-ai/sdk/v2";
import { CheckCircle2, Coins, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CollapsiblePart from "./CollapsiblePart";

interface StepFinishPartProps {
  part: StepFinishPartType;
}

export function StepFinishPart({ part }: StepFinishPartProps) {
  const formatNumber = (num: number) => num.toLocaleString();
  const totalTokens =
    part.tokens.input + part.tokens.output + part.tokens.reasoning;
  const detail = part.reason
    ? `${part.reason.slice(0, 40)} - ${totalTokens} tokens`
    : `${totalTokens} tokens`;

  return (
    <CollapsiblePart label="Step Completed" detail={detail}>
      <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Step Completed
              </span>
              {part.cost > 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  ${part.cost.toFixed(6)}
                </span>
              )}
            </div>

            {part.reason && (
              <div className="text-sm text-emerald-900 dark:text-emerald-100">
                {part.reason}
              </div>
            )}

            {(part.tokens.input > 0 ||
              part.tokens.output > 0 ||
              part.tokens.reasoning > 0) && (
              <div className="flex flex-wrap gap-3 text-xs">
                {part.tokens.input > 0 && (
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                    <Coins className="size-3" />
                    <span>Input: {formatNumber(part.tokens.input)}</span>
                  </div>
                )}
                {part.tokens.output > 0 && (
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                    <Coins className="size-3" />
                    <span>Output: {formatNumber(part.tokens.output)}</span>
                  </div>
                )}
                {part.tokens.reasoning > 0 && (
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                    <Database className="size-3" />
                    <span>Reasoning: {formatNumber(part.tokens.reasoning)}</span>
                  </div>
                )}
              </div>
            )}

            {(part.tokens.cache.read > 0 || part.tokens.cache.write > 0) && (
              <div className="flex flex-wrap gap-3 text-xs">
                {part.tokens.cache.read > 0 && (
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                    <Database className="size-3" />
                    <span>
                      Cache Read: {formatNumber(part.tokens.cache.read)}
                    </span>
                  </div>
                )}
                {part.tokens.cache.write > 0 && (
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                    <Database className="size-3" />
                    <span>
                      Cache Write: {formatNumber(part.tokens.cache.write)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {part.snapshot && (
              <div className="text-xs font-mono bg-emerald-100 dark:bg-emerald-900/50 rounded p-2 overflow-x-auto">
                {part.snapshot}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
