import type { CompactionMessagePart } from "@repo/ai-core";
import { Minimize2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@repo/ui/components/card";
import { CollapsiblePart } from "./CollapsiblePart";

interface CompactionPartProps {
  part: CompactionMessagePart;
}

export function CompactionPart({ part }: CompactionPartProps) {
  const detail = part.automatic ? "Auto" : "Manual";

  return (
    <CollapsiblePart label="Compaction" detail={detail}>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Minimize2 className="size-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Compaction
            </span>
            {part.automatic ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="size-3" />
                <span>Auto</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Manual</span>
            )}
          </div>
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
