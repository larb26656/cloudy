import { Terminal } from "lucide-react";
import { ToolValueRenderer } from "./ToolValueRenderer";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import { CodeBlock } from "@/components/markdown/CodeBlock";

interface BashToolInputProps {
  input: Record<string, unknown>;
}

export function Detail({ input }: BashToolInputProps) {
  return (
    <div className="space-y-2 mt-2 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-md">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
        <Terminal className="size-3" />
        <span>Command</span>
      </div>
      <pre className="text-xs font-mono bg-slate-950 dark:bg-slate-950 text-slate-50 p-2 rounded overflow-x-auto">
        {String(input.command)}
      </pre>
      {input.description != null && (
        <div className="text-xs text-muted-foreground" key="description">
          <span className="font-medium">Description:</span>{" "}
          {String(input.description)}
        </div>
      )}
      {input.workdir != null && (
        <div className="text-xs text-muted-foreground" key="workdir">
          <span className="font-medium">Directory:</span>{" "}
          <code className="bg-muted px-1 rounded">{String(input.workdir)}</code>
        </div>
      )}
      {(input.timeout != null || input.env != null) && (
        <details className="text-xs">
          <summary className="cursor-pointer hover:underline text-muted-foreground">
            Show options
          </summary>
          <div className="mt-1 pl-2 border-l-2 border-muted-foreground/30">
            {input.timeout != null && (
              <div className="py-0.5" key="timeout">
                <span className="font-medium text-muted-foreground">
                  timeout:
                </span>{" "}
                <ToolValueRenderer value={input.timeout} keyName="timeout" />
              </div>
            )}
            {input.env != null && (
              <div className="py-0.5" key="env">
                <span className="font-medium text-muted-foreground">env:</span>{" "}
                <ToolValueRenderer value={input.env} keyName="env" />
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

export function Preview({ state }: { state: ToolPartType["state"] }) {
  const command = state.input.command as string | undefined;

  return <CodeBlock>{command || "Running command..."}</CodeBlock>;
}
