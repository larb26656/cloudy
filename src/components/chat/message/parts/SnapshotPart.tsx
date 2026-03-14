import type { SnapshotPart as SnapshotPartType } from "@opencode-ai/sdk/v2";
import { Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CollapsiblePart from "./CollapsiblePart";

interface SnapshotPartProps {
  part: SnapshotPartType;
}

export function SnapshotPart({ part }: SnapshotPartProps) {
  return (
    <CollapsiblePart
      label="Snapshot"
      detail={part.snapshot?.slice(0, 50) || ""}
    >
      <Card className="bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-slate-600 dark:text-slate-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Snapshot
              </span>
            </div>
            <div className="text-xs font-mono bg-slate-100 dark:bg-slate-900/50 rounded p-2 overflow-x-auto">
              {part.snapshot}
            </div>
          </div>
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
