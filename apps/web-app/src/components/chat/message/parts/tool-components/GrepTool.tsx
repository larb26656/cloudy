import { Search } from "lucide-react";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import { ExpandableToolCard } from "./ExpandableToolCard";
import { ToolValueRenderer } from "./ToolValueRenderer";
import type { ToolComponentProps } from "./types";

export function GrepTool({ state }: ToolComponentProps) {
  const input = state.input;
  const pattern = input.pattern as string | undefined;
  const path = input.path as string | undefined;

  const label = pattern
    ? `Searching: "${pattern}"${path ? ` in ${path}` : ""}`
    : "Searching...";

  return (
    <ExpandableToolCard
      tool="grep"
      state={state}
      preview={
        <ToolPreviewLabel icon={<Search className="size-3" />} label={label} />
      }
      detail={
        <div className="space-y-1.5 mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
          <div className="flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-300">
            <Search className="size-3" />
            <span>Search</span>
          </div>
          {input.pattern != null && (
            <div className="text-xs" key="pattern">
              <span className="text-muted-foreground">pattern:</span>{" "}
              <code className="bg-purple-100 dark:bg-purple-900/50 px-1 rounded font-mono">
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
          {input.include != null && (
            <div className="text-xs" key="include">
              <span className="text-muted-foreground">include:</span>{" "}
              <ToolValueRenderer value={input.include} keyName="include" />
            </div>
          )}
        </div>
      }
    />
  );
}
