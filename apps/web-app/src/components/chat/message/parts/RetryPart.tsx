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
      <Card>
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="size-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Retry
              </span>
              <span className="text-xs text-muted-foreground">
                Attempt #{part.attempt}
              </span>
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-3 text-destructive mt-0.5" />
                <div className="text-xs">
                  {part.error.data.message}
                </div>
              </div>
              {part.error.data.statusCode && (
                <div className="text-xs text-muted-foreground ml-5">
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
