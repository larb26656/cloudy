export type AgentMode = "primary" | "subagent" | "all";

export interface AgentReference {
  id: string;
  name?: string;
}

export interface AgentInfo extends AgentReference {
  description?: string;
  mode?: AgentMode;
  native?: boolean;
  hidden?: boolean;
  metadata?: Record<string, unknown>;
}
