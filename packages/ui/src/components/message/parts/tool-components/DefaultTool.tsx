import { Wrench } from "lucide-react";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import { ExpandableToolCard } from "./ExpandableToolCard";
import { ToolValueRenderer } from "./ToolValueRenderer";
import type { ToolComponentProps } from "./types";

export function DefaultTool({ tool, state }: ToolComponentProps) {
  const input = state.input;
  const firstKey = Object.keys(input)[0];
  const firstValue = firstKey ? input[firstKey] : undefined;
  const displayValue =
    typeof firstValue === "string" && firstValue.length > 30
      ? firstValue.substring(0, 30) + "..."
      : String(firstValue ?? "");

  const label = firstKey ? `${firstKey}: ${displayValue}` : tool;

  return (
    <ExpandableToolCard
      tool={tool}
      state={state}
      preview={
        <ToolPreviewLabel icon={<Wrench className="size-3" />} label={label} />
      }
      detail={
        <div className="space-y-1.5 mt-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-md">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Wrench className="size-3" />
            <span>Parameters</span>
          </div>
          <div className="text-xs space-y-0.5">
            {Object.entries(input).map(([key, value]) => (
              <div key={key} className="py-0.5">
                <span className="font-medium text-muted-foreground">
                  {key}:
                </span>{" "}
                <ToolValueRenderer value={value} keyName={key} />
              </div>
            ))}
          </div>
          {state.output !== undefined && state.status !== "completed" && (
            <div className="min-w-0 border-t border-border pt-2 text-xs">
              <div className="mb-1 font-medium text-muted-foreground">
                Output
              </div>
              <div className="max-h-64 overflow-auto break-words">
                <ToolValueRenderer value={state.output} keyName="output" />
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
