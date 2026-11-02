import type { ToolMessagePart } from "@repo/ai-core";
import { getToolComponent } from "./tool-components/registry";
import { ToolValueRenderer } from "./tool-components/ToolValueRenderer";

interface ToolPartProps {
  part: ToolMessagePart;
}

export function ToolPart({ part }: ToolPartProps) {
  const rawMetadata = part.metadata?.acp;
  const partial = !part.toolName || !part.status;
  const rawDetails = rawMetadata === undefined && (!partial || (part.input === undefined && part.output === undefined)) ? null : (
    <details className="mt-1 text-xs text-muted-foreground">
      <summary className="cursor-pointer">Raw tool details</summary>
      {partial && part.input !== undefined && (
        <ToolValueRenderer value={part.input} keyName="input" />
      )}
      {partial && part.output !== undefined && (
        <ToolValueRenderer value={part.output} keyName="output" />
      )}
      {rawMetadata !== undefined && <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap wrap-anywhere">
        {JSON.stringify(rawMetadata, null, 2)}
      </pre>}
    </details>
  );
  if (!part.toolName || !part.status) {
    return (
      <div>
        <div>
          Tool activity{part.toolName ? `: ${part.toolName}` : ""}
          {part.status ? ` (${part.status})` : ""}
        </div>
        {rawDetails}
      </div>
    );
  }
  const ToolComponent = getToolComponent(part.toolName);
  const state = part.state ?? {
    status: part.status === "failed" ? "error" : part.status,
    input:
      typeof part.input === "object" && part.input !== null
        ? (part.input as Record<string, unknown>)
        : part.input === undefined
          ? {}
          : { value: part.input },
    output: part.output,
    error: part.error,
  };
  return (
    <div>
      <ToolComponent tool={part.toolName} state={state} />
      {rawDetails}
    </div>
  );
}
