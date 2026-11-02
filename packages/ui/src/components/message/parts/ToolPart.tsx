import type { ToolMessagePart } from "@repo/ai-core";
import { getToolComponent } from "./tool-components/registry";
import { ToolValueRenderer } from "./tool-components/ToolValueRenderer";

interface ToolPartProps {
  part: ToolMessagePart;
}

export function ToolPart({ part }: ToolPartProps) {
  if (!part.toolName || !part.status) {
    return (
      <div>
        <div>
          Tool activity{part.toolName ? `: ${part.toolName}` : ""}
          {part.status ? ` (${part.status})` : ""}
        </div>
        {part.input !== undefined && (
          <ToolValueRenderer value={part.input} keyName="input" />
        )}
        {part.output !== undefined && (
          <ToolValueRenderer value={part.output} keyName="output" />
        )}
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
  return <ToolComponent tool={part.toolName} state={state} />;
}
