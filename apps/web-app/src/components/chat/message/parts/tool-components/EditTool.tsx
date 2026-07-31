import { Files } from "lucide-react";
import { createTwoFilesPatch } from "diff";
import { DiffViewer } from "@/components/markdown/DiffViewer";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import type { ToolComponentProps } from "./types";

export function EditTool({ state }: ToolComponentProps) {
  const input = state.input;
  const filePath = String(input.filePath ?? "");
  const oldString = String(input.oldString ?? "");
  const newString = String(input.newString ?? "");

  return (
    <div className="space-y-1">
      {filePath &&
        (oldString || newString) && (
          <DiffViewer
            diff={createTwoFilesPatch(filePath, filePath, oldString, newString)}
            filePath={filePath}
            viewMode="line-by-line"
            showLineNumbers={true}
          />
        )}
      {filePath && (
        <ToolPreviewLabel
          icon={<Files className="size-3" />}
          label={`Path: ${filePath}`}
        />
      )}
    </div>
  );
}
