import type { SnapshotMessagePart } from "@repo/ai-core";
import { Camera } from "lucide-react";
import { Card, CardContent } from "@repo/ui/components/card";
import { CollapsiblePart } from "./CollapsiblePart";

interface SnapshotPartProps {
  part: SnapshotMessagePart;
}

export function SnapshotPart({ part }: SnapshotPartProps) {
  return (
    <CollapsiblePart
      label="Snapshot"
      detail={part.snapshot?.slice(0, 50) || ""}
    >
      <Card>
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Snapshot
              </span>
            </div>
            <div className="text-xs font-mono bg-muted rounded p-2 overflow-x-auto">
              {part.snapshot}
            </div>
          </div>
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
