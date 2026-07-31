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
      preview={<ToolPreviewLabel icon={<Wrench className="size-3" />} label={label} />}
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
        </div>
      }
    />
  );
}
