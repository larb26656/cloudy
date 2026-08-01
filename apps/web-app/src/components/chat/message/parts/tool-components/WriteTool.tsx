import { Files } from "lucide-react";
import { CodeBlock } from "@/components/markdown/CodeBlock";
import { PathText } from "@/components/ui/path-text";
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
          label={<PathText path={filePath} className="font-mono" />}
        />
      )}
    </div>
  );
}
