import { Wrench } from "lucide-react";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import { ToolValueRenderer } from "./ToolValueRenderer";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";

interface DefaultToolInputProps {
  input: Record<string, unknown>;
}

export function Detail({ input }: DefaultToolInputProps) {
  return (
    <div className="space-y-1.5 mt-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-md">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
        <Wrench className="size-3" />
        <span>Parameters</span>
      </div>
      <div className="text-xs space-y-0.5">
        {Object.entries(input).map(([key, value]) => (
          <div key={key} className="py-0.5">
            <span className="font-medium text-muted-foreground">{key}:</span>{" "}
            <ToolValueRenderer value={value} keyName={key} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Preview({ tool, state }: { tool: string; state: ToolPartType["state"] }) {
  const firstKey = Object.keys(state.input)[0];
  const firstValue = firstKey ? state.input[firstKey] : undefined;
  const displayValue = typeof firstValue === "string" && firstValue.length > 30
    ? firstValue.substring(0, 30) + "..."
    : String(firstValue ?? "");

  const label = firstKey ? `${firstKey}: ${displayValue}` : tool;

  return (
    <ToolPreviewLabel icon={<Wrench className="size-3" />} label={label} />
  );
}
