import type { ReasoningPart as ReasoningPartType } from "@opencode-ai/sdk/v2";
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ReasoningPartProps {
  part: ReasoningPartType;
}

export function ReasoningPart({ part }: ReasoningPartProps) {
  const duration = part.time.end
    ? `${((part.time.end - part.time.start) / 1000).toFixed(2)}s`
    : null;

  return (
    <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <Brain className="size-4 text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
            Reasoning
          </span>
          {duration && (
            <span className="text-xs text-purple-600 dark:text-purple-400">
              {duration}
            </span>
          )}
        </div>
        <div className="text-sm text-purple-900 dark:text-purple-100 font-mono leading-relaxed whitespace-pre-wrap">
          {part.text}
        </div>
      </CardContent>
    </Card>
  );
}
