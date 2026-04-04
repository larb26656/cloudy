import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@cloudy/ui";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import type { ReactNode } from "react";

interface ToolStateDisplayProps {
  state: ToolPartType["state"];
  children: ReactNode;
}

export function ToolStateDisplay({ state, children }: ToolStateDisplayProps) {
  if (state.status === "pending") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Loader2 className="size-3 text-blue-600 dark:text-blue-400 animate-pulse" />
          <span className="text-xs text-blue-700 dark:text-blue-300">
            Pending
          </span>
        </div>
        {children}
      </div>
    );
  }

  if (state.status === "running") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Loader2 className="size-3 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="text-xs text-blue-700 dark:text-blue-300">
            Running
          </span>
          {state.title && (
            <span className="text-xs text-blue-900 dark:text-blue-100">
              {state.title}
            </span>
          )}
        </div>
        {children}
      </div>
    );
  }

  if (state.status === "completed") {
    const duration = state.time.end
      ? `${((state.time.end - state.time.start) / 1000).toFixed(2)}s`
      : null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="size-3 text-green-600 dark:text-green-400" />
          <span className="text-xs text-green-700 dark:text-green-300">
            Completed
          </span>
          {duration && (
            <span className="text-xs text-muted-foreground">({duration})</span>
          )}
        </div>
        {state.title && (
          <div className="text-sm text-green-900 dark:text-green-100 font-medium">
            {state.title}
          </div>
        )}
        {children}
        {state.output && (
          <div className="text-xs font-mono bg-green-100 dark:bg-green-900/50 rounded p-2 overflow-x-auto">
            {state.output}
          </div>
        )}
        {state.attachments && state.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {state.attachments.map((file) => (
              <Badge key={file.id} variant="secondary" className="text-xs">
                {file.filename || file.url}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (state.status === "error") {
    const duration = state.time.end
      ? `${((state.time.end - state.time.start) / 1000).toFixed(2)}s`
      : null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <XCircle className="size-3 text-red-600 dark:text-red-400" />
          <span className="text-xs text-red-700 dark:text-red-300">Error</span>
          {duration && (
            <span className="text-xs text-muted-foreground">({duration})</span>
          )}
        </div>
        {children}
        <div className="text-xs text-red-900 dark:text-red-100 bg-red-100 dark:bg-red-900/50 rounded p-2">
          {state.error}
        </div>
      </div>
    );
  }

  return null;
}
