import { Terminal } from "lucide-react";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import { CodeBlock } from "@/components/markdown/CodeBlock";
import { ToolPreviewLabel } from "../ToolPreviewLabel";

interface BashToolInputProps {
  input: Record<string, unknown>;
}

export function Detail({ input }: BashToolInputProps) {
  const command = input.command as string | undefined;
  return <CodeBlock>{command || "Running command..."}</CodeBlock>;
}

export function Preview({ state }: { state: ToolPartType["state"] }) {
  const description =
    (state.input.description as string | undefined) || "Running command...";

  return (
    <div className="flex flex-col">
      {description && (
        <ToolPreviewLabel
          icon={<Terminal className="size-3" />}
          label={`${description}`}
        />
      )}
    </div>
  );
}
