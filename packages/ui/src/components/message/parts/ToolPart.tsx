import type { ToolMessagePart } from "@repo/ai-core";
import { getToolComponent } from "./tool-components/registry";

interface ToolPartProps {
  part: ToolMessagePart;
}

export function ToolPart({ part }: ToolPartProps) {
  const ToolComponent = getToolComponent(part.toolName);
  const state = part.state ?? {
    status: part.status === "failed" ? "error" : part.status,
    input:
      typeof part.input === "object" && part.input !== null
        ? (part.input as Record<string, unknown>)
        : {},
    output: part.output,
    error: part.error,
  };
  return <ToolComponent tool={part.toolName} state={state} />;
}
