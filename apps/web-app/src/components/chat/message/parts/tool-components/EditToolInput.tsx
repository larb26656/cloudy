import { Files, FileText } from "lucide-react";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import { createTwoFilesPatch } from "diff";
import { DiffViewer } from "@/components/markdown/DiffViewer";
import { ToolPreviewLabel } from "../ToolPreviewLabel";

interface EditToolInputProps {
  input: Record<string, unknown>;
}

export function Detail({ input }: EditToolInputProps) {
  return (
    <div className="space-y-1.5 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
      <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
        <FileText className="size-3" />
        <span>Edit</span>
      </div>
      {input.filePath != null && (
        <div className="text-xs" key="filePath">
          <span className="text-muted-foreground">path:</span>{" "}
          <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">
            {String(input.filePath)}
          </code>
        </div>
      )}
      {input.oldString != null && typeof input.oldString === "string" && (
        <div className="text-xs" key="oldString">
          <span className="text-muted-foreground">old:</span>
          <pre className="mt-1 text-xs bg-red-100 dark:bg-red-900/30 p-1 rounded line-through overflow-x-auto">
            {input.oldString.length > 100
              ? input.oldString.substring(0, 100) + "..."
              : input.oldString}
          </pre>
        </div>
      )}
      {input.newString != null && typeof input.newString === "string" && (
        <div className="text-xs">
          <span className="text-muted-foreground">new:</span>
          <pre className="mt-1 text-xs bg-green-100 dark:bg-green-900/30 p-1 rounded overflow-x-auto">
            {input.newString.length > 100
              ? input.newString.substring(0, 100) + "..."
              : input.newString}
          </pre>
        </div>
      )}
    </div>
  );
}

export function Preview({ state }: { state: ToolPartType["state"] }) {
  const filePath = String(state.input.filePath ?? "");
  const oldString = String(state.input.oldString ?? "");
  const newString = String(state.input.newString ?? "");

  return (
    <div className="flex flex-col">
      {filePath && (
        <ToolPreviewLabel
          icon={<Files className="size-3" />}
          label={`Path: ${filePath}`}
        />
      )}

      {filePath && (oldString || newString) && (
        <DiffViewer
          diff={createTwoFilesPatch(filePath, filePath, oldString, newString)}
          viewMode="line-by-line"
        />
      )}
    </div>
  );
}
