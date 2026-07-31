import { Globe } from "lucide-react";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import { ExpandableToolCard } from "./ExpandableToolCard";
import { ToolValueRenderer } from "./ToolValueRenderer";
import type { ToolComponentProps } from "./types";

export function WebTool({ tool, state }: ToolComponentProps) {
  const input = state.input;
  const url = input.url as string | undefined;
  const query = input.query as string | undefined;
  const isFetch = tool === "webfetch";

  const label = isFetch
    ? url
      ? `Fetching: ${url}`
      : "Fetching URL..."
    : query
      ? `Searching: ${query}`
      : "Web searching...";

  return (
    <ExpandableToolCard
      tool={tool}
      state={state}
      preview={<ToolPreviewLabel icon={<Globe className="size-3" />} label={label} />}
      detail={
        <div className="space-y-1.5 mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md">
          <div className="flex items-center gap-1.5 text-xs font-medium text-orange-700 dark:text-orange-300">
            <Globe className="size-3" />
            <span>{isFetch ? "Fetch" : "Search"}</span>
          </div>
          {input.url != null && (
            <div className="text-xs" key="url">
              <span className="text-muted-foreground">url:</span>{" "}
              <code className="bg-orange-100 dark:bg-orange-900/50 px-1 rounded break-all">
                {String(input.url)}
              </code>
            </div>
          )}
          {input.query != null && (
            <div className="text-xs" key="query">
              <span className="text-muted-foreground">query:</span>{" "}
              <span className="bg-orange-100 dark:bg-orange-900/50 px-1 rounded">
                <ToolValueRenderer value={input.query} keyName="query" />
              </span>
            </div>
          )}
          {input.format != null && (
            <div className="text-xs" key="format">
              <span className="text-muted-foreground">format:</span>{" "}
              <ToolValueRenderer value={input.format} keyName="format" />
            </div>
          )}
          {input.timeout != null && (
            <div className="text-xs" key="timeout">
              <span className="text-muted-foreground">timeout:</span>{" "}
              <ToolValueRenderer value={input.timeout} keyName="timeout" />
            </div>
          )}
        </div>
      }
    />
  );
}
