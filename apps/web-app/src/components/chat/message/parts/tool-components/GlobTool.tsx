import { Files } from "lucide-react";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import { ExpandableToolCard } from "./ExpandableToolCard";
import type { ToolComponentProps } from "./types";

export function GlobTool({ state }: ToolComponentProps) {
  const input = state.input;
  const pattern = input.pattern as string | undefined;

  return (
    <ExpandableToolCard
      tool="glob"
      state={state}
      preview={
        <ToolPreviewLabel
          icon={<Files className="size-3" />}
          label={pattern ? `Pattern: ${pattern}` : "Finding files..."}
        />
      }
      detail={
        <div className="space-y-1.5 mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
          <div className="flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-300">
            <Files className="size-3" />
            <span>Pattern</span>
          </div>
          {input.pattern != null && (
            <div className="text-xs" key="pattern">
              <span className="text-muted-foreground">pattern:</span>{" "}
              <code className="bg-purple-100 dark:bg-purple-900/50 px-1 rounded">
                {String(input.pattern)}
              </code>
            </div>
          )}
          {input.path != null && (
            <div className="text-xs" key="path">
              <span className="text-muted-foreground">path:</span>{" "}
              <code className="bg-purple-100 dark:bg-purple-900/50 px-1 rounded">
                {String(input.path)}
              </code>
            </div>
          )}
        </div>
      }
    />
  );
}
