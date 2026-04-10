import type { PatchPart as PatchPartType } from "@opencode-ai/sdk/v2";
import { GitCommit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CollapsiblePart from "./CollapsiblePart";

interface PatchPartProps {
  part: PatchPartType;
}

export function PatchPart({ part }: PatchPartProps) {
  const fileCount = part.files?.length ?? 0;

  return (
    <CollapsiblePart
      label="Patch"
      detail={`${part.hash?.slice(0, 7)} (${fileCount} file${fileCount !== 1 ? "s" : ""})`}
    >
      <Card>
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GitCommit className="size-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Patch
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                {part.hash}
              </span>
            </div>
            {part.files && part.files.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {part.files.length} file{part.files.length > 1 ? "s" : ""}{" "}
                  modified:
                </div>
                <ul className="text-xs space-y-1">
                  {part.files.map((file, index) => (
                    <li key={index} className="font-mono truncate">
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
