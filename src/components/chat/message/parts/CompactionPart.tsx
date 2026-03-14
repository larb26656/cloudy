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
      <Card className="bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Minimize2 className="size-4 text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
              Compaction
            </span>
            {part.auto ? (
              <div className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400">
                <Sparkles className="size-3" />
                <span>Auto</span>
              </div>
            ) : (
              <span className="text-xs text-violet-600 dark:text-violet-400">
                Manual
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
