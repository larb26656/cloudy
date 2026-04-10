import type { StepStartPart as StepStartPartType } from "@opencode-ai/sdk/v2";
import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CollapsiblePart from "./CollapsiblePart";

interface StepStartPartProps {
  part: StepStartPartType;
}

export function StepStartPart({ part }: StepStartPartProps) {
  return (
    <CollapsiblePart
      label="Step Started"
      detail={part.snapshot?.slice(0, 50) || ""}
    >
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Play className="size-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Step Started
            </span>
          </div>
          {part.snapshot && (
            <div className="mt-2 text-xs font-mono bg-muted rounded p-2 overflow-x-auto">
              {part.snapshot}
            </div>
          )}
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
