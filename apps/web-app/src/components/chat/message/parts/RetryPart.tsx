import type { RetryPart as RetryPartType } from "@opencode-ai/sdk/v2";
import { RotateCcw, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CollapsiblePart from "./CollapsiblePart";
import { formatTime } from "@/lib/date";

interface RetryPartProps {
  part: RetryPartType;
}

export function RetryPart({ part }: RetryPartProps) {
  const time = formatTime(part.time.created);

  return (
    <CollapsiblePart
      label="Retry"
      detail={`Attempt #${part.attempt} - ${part.error.data.message?.slice(0, 30) || ""}`}
    >
      <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="size-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Retry
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Attempt #{part.attempt}
              </span>
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-3 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="text-xs text-red-900 dark:text-red-100">
                  {part.error.data.message}
                </div>
              </div>
              {part.error.data.statusCode && (
                <div className="text-xs text-amber-700 dark:text-amber-300 ml-5">
                  Status: {part.error.data.statusCode}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
