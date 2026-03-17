import { Files, FileText } from "lucide-react";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import { CodeBlock } from "@/components/markdown/CodeBlock";
import { ToolPreviewLabel } from "../ToolPreviewLabel";

interface WriteToolInputProps {
  input: Record<string, unknown>;
}

export function Detail({ input }: WriteToolInputProps) {
  return (
    <div className="space-y-1.5 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
      <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
        <FileText className="size-3" />
        <span>Write</span>
      </div>
      {input.filePath != null && (
        <div className="text-xs" key="filePath">
          <span className="text-muted-foreground">path:</span>{" "}
          <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">
            {String(input.filePath)}
          </code>
        </div>
      )}
      {input.content != null && typeof input.content === "string" && (
        <details className="text-xs">
          <summary className="cursor-pointer hover:underline text-muted-foreground">
            Show content
          </summary>
          <pre className="mt-1 text-xs bg-slate-950 dark:bg-slate-950 text-slate-50 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
            {input.content.length > 500
              ? input.content.substring(0, 500) + "..."
              : input.content}
          </pre>
        </details>
      )}
    </div>
  );
}

export function Preview({ state }: { state: ToolPartType["state"] }) {
  const filePath = state.input.filePath as string | undefined;
  const input = state.input.content as string | undefined;

  return (
    <div className="flex flex-col">
      <ToolPreviewLabel
        icon={<Files className="size-3" />}
        label={`Path: ${filePath}`}
      />
      {input && <CodeBlock>{input}</CodeBlock>}
    </div>
  );
}
