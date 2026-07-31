import { Files } from "lucide-react";
import { CodeBlock } from "@/components/markdown/CodeBlock";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import type { ToolComponentProps } from "./types";

export function WriteTool({ state }: ToolComponentProps) {
  const input = state.input;
  const filePath = String(input.filePath ?? "");
  const content = String(input.content ?? "");

  return (
    <div className="space-y-1">
      {filePath && content && (
        <CodeBlock fileName={filePath} showLineNumbers={true}>
          {content}
        </CodeBlock>
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
