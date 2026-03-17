import { FileText } from "lucide-react";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import { ToolValueRenderer } from "./ToolValueRenderer";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";

interface ReadToolInputProps {
  input: Record<string, unknown>;
}

export function Detail({ input }: ReadToolInputProps) {
  return (
    <div className="space-y-1.5 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
      <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
        <FileText className="size-3" />
        <span>File</span>
      </div>
      {input.filePath != null && (
        <div className="text-xs" key="filePath">
          <span className="text-muted-foreground">path:</span>{" "}
          <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">
            {String(input.filePath)}
          </code>
        </div>
      )}
      {(input.offset != null || input.limit != null) && (
        <div className="flex gap-2 text-xs" key="offset-limit">
          {input.offset != null && (
            <span>
              <span className="text-muted-foreground">offset:</span>{" "}
              <ToolValueRenderer value={input.offset} keyName="offset" />
            </span>
          )}
          {input.limit != null && (
            <span>
              <span className="text-muted-foreground">limit:</span>{" "}
              <ToolValueRenderer value={input.limit} keyName="limit" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function Preview({ state }: { state: ToolPartType["state"] }) {
  const filePath = state.input.filePath as string | undefined;

  return (
    <ToolPreviewLabel 
      icon={<FileText className="size-3" />} 
      label={filePath || "Reading file..."} 
    />
  );
}
