import type { CompactionPart as CompactionPartType } from "@opencode-ai/sdk/v2";
import { Minimize2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CollapsiblePart from "./CollapsiblePart";

interface CompactionPartProps {
  part: CompactionPartType;
}

export function CompactionPart({ part }: CompactionPartProps) {
  const detail = part.auto ? "Auto" : "Manual";

  return (
    <CollapsiblePart label="Compaction" detail={detail}>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Minimize2 className="size-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Compaction
            </span>
            {part.auto ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="size-3" />
                <span>Auto</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                Manual
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
