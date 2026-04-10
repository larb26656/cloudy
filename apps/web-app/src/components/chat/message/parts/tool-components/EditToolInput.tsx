import { Files, FileText } from "lucide-react";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import { createTwoFilesPatch } from "diff";
import { DiffViewer } from "@/components/markdown/DiffViewer";
import { ToolPreviewLabel } from "../ToolPreviewLabel";

interface EditToolInputProps {
  input: Record<string, unknown>;
}

export function Detail({ input }: EditToolInputProps) {
  const filePath = String(input.filePath ?? "");
  const oldString = String(input.oldString ?? "");
  const newString = String(input.newString ?? "");

  return (
    filePath &&
    (oldString || newString) && (
      <DiffViewer
        diff={createTwoFilesPatch(filePath, filePath, oldString, newString)}
        viewMode="line-by-line"
      />
    )
  );
}

export function Preview({ state }: { state: ToolPartType["state"] }) {
  const filePath = String(state.input.filePath ?? "");

  return (
    <div className="flex flex-col">
      {filePath && (
        <ToolPreviewLabel
          icon={<Files className="size-3" />}
          label={`Path: ${filePath}`}
        />
      )}
    </div>
  );
}
