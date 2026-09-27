import type { AgentInfo } from "./agent";
import type { ChatMessage } from "./message";
import type { ModelInfo } from "./model";
import type {
  InteractionResponse,
  InteractionResponseInput,
  PermissionRequest,
  ProviderQuestionRequest,
  SendMessageInput,
} from "./interaction";
import type { ChatEvent } from "./event";
import type { ChatSession, RunStatus } from "./session";

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

export interface ProviderEventsInput {
  directory?: string;
  sessionId?: string;
  signal?: AbortSignal;
}

export interface ProviderSessionInput {
  sessionId?: string;
  directory?: string;
  parentId?: string;
  title?: string;
  agentId?: string;
  model?: { providerId: string; modelId: string };
  metadata?: Record<string, unknown>;
  messageId?: string;
}

export interface ProviderMessagesInput {
  sessionId: string;
  directory?: string;
  limit?: number;
  before?: string;
}

export interface ProviderMessagePage {
  messages: ChatMessage[];
  nextCursor?: string;
}

export interface ProviderAdapter {
  readonly id: string;
  readonly capabilities: ProviderCapabilities;
  getInfo(): Promise<ProviderInfo>;
  listSessions?(input: {
    directory?: string;
    limit?: number;
  }): Promise<ChatSession[]>;
  getSession?(input: {
    sessionId: string;
    directory?: string;
  }): Promise<ChatSession>;
  getSessionChildren?(input: {
    sessionId: string;
    directory?: string;
  }): Promise<ChatSession[]>;
  getSessionStatuses?(input: {
    directory?: string;
  }): Promise<Record<string, RunStatus>>;
  listMessages?(input: ProviderMessagesInput): Promise<ProviderMessagePage>;
  createSession?(input: ProviderSessionInput): Promise<ChatSession>;
  updateSession?(input: ProviderSessionInput): Promise<ChatSession>;
  deleteSession?(input: {
    sessionId: string;
    directory?: string;
  }): Promise<void>;
  forkSession?(input: ProviderSessionInput): Promise<ChatSession>;
  abortSession?(input: {
    sessionId: string;
    directory?: string;
  }): Promise<void>;
  sendMessage?(request: ProviderMessageRequest): Promise<InteractionResponse>;
  respondToInteraction?(
    response: InteractionResponseInput,
  ): Promise<InteractionResponse>;
  listPermissions?(input: { directory?: string }): Promise<PermissionRequest[]>;
  listQuestions?(input: {
    directory?: string;
    sessionId?: string;
  }): Promise<ProviderQuestionRequest[]>;
  subscribeEvents(input?: ProviderEventsInput): AsyncIterable<ChatEvent>;
}
