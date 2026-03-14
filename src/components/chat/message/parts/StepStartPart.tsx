import type { StepStartPart as StepStartPartType } from "@opencode-ai/sdk/v2";
import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StepStartPartProps {
  part: StepStartPartType;
}

export function StepStartPart({ part }: StepStartPartProps) {
  return (
    <Card className="bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Play className="size-4 text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">
            Step Started
          </span>
        </div>
        {part.snapshot && (
          <div className="mt-2 text-xs font-mono bg-cyan-100 dark:bg-cyan-900/50 rounded p-2 overflow-x-auto">
            {part.snapshot}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
