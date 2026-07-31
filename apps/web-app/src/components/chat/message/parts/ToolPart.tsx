import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import { getToolComponent } from "./tool-components/registry";

interface ToolPartProps {
  part: ToolPartType;
}

export function ToolPart({ part }: ToolPartProps) {
  const ToolComponent = getToolComponent(part.tool);
  return <ToolComponent tool={part.tool} state={part.state} />;
}
