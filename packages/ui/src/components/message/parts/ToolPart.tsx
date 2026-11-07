import type { ToolMessagePart } from "@repo/ai-core";

import { getToolComponent } from "./tool-components/registry";

interface ToolPartProps {
  part: ToolMessagePart;
}

export function ToolPart({ part }: ToolPartProps) {
  if (!part.toolName || !part.status) {
    return (
      <div>
        <div>
          {part.title ??
            (part.toolName
              ? `Tool activity: ${part.toolName}`
              : "Tool activity")}
          {part.status ? ` (${part.status})` : ""}
        </div>
      </div>
    );
  }

  const ToolComponent = getToolComponent(part.toolName);

  const state = part.state ?? {
    status: part.status === "failed" ? "error" : part.status,
    title: part.title,
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
