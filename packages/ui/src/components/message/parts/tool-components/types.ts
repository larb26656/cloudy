import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";

export interface ToolComponentProps {
  tool: string;
  state: ToolPartType["state"];
}
