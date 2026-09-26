import type { ToolMessagePartState } from "@repo/ai-core";

export interface ToolComponentProps {
  tool: string;
  state: ToolMessagePartState;
}
