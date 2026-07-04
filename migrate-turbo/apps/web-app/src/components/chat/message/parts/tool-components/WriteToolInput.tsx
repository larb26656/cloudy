import { Files } from "lucide-react";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import { CodeBlock } from "@/components/markdown/CodeBlock";
import { ToolPreviewLabel } from "../ToolPreviewLabel";

interface WriteToolInputProps {
  input: Record<string, unknown>;
}

export function Detail({ input }: WriteToolInputProps) {
  const filePath = String(input.filePath ?? "");
  const content = String(input.content ?? "");

  return filePath && content && <CodeBlock>{content}</CodeBlock>;
}

export function Preview({ state }: { state: ToolPartType["state"] }) {
  const filePath = state.input.filePath as string | undefined;

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
