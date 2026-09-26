import type { AgentInfo } from "./agent";
import type { ChatMessage } from "./message";
import type { ModelInfo } from "./model";
import type { SendMessageInput } from "./interaction";

export interface ProviderCapabilities {
  streaming: boolean;
  approvals?: boolean;
  questions?: boolean;
  attachments?: boolean;
  tools?: boolean;
  reasoning?: boolean;
  models?: boolean;
  agents?: boolean;
}

export interface ProviderInfo {
  id: string;
  name: string;
  capabilities: ProviderCapabilities;
  models?: ModelInfo[];
  agents?: AgentInfo[];
  metadata?: Record<string, unknown>;
}

export interface ProviderMessageRequest extends SendMessageInput {
  history?: ChatMessage[];
}
