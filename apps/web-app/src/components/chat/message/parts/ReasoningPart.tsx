import type { ReasoningPart as ReasoningPartType } from "@opencode-ai/sdk/v2";
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CollapsiblePart from "./CollapsiblePart";

interface ReasoningPartProps {
  part: ReasoningPartType;
}

export function ReasoningPart({ part }: ReasoningPartProps) {
  const duration = part.time.end
    ? `${((part.time.end - part.time.start) / 1000).toFixed(2)}s`
    : null;

  return (
    <CollapsiblePart label="Thinking" detail={duration || ""}>
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="size-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Reasoning
            </span>
            {duration && (
              <span className="text-xs text-muted-foreground">
                {duration}
              </span>
            )}
          </div>
          <div className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
            {part.text}
          </div>
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
