import type { PatchPart as PatchPartType } from "@opencode-ai/sdk/v2";
import { GitCommit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PatchPartProps {
  part: PatchPartType;
}

export function PatchPart({ part }: PatchPartProps) {
  return (
    <Card className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800">
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <GitCommit className="size-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
              Patch
            </span>
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
              {part.hash}
            </span>
          </div>
          {part.files && part.files.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-indigo-700 dark:text-indigo-300">
                {part.files.length} file{part.files.length > 1 ? "s" : ""}{" "}
                modified:
              </div>
              <ul className="text-xs text-indigo-900 dark:text-indigo-100 space-y-1">
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
  );
}
