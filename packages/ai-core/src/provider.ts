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
import type { CanonicalSessionId, ChatEvent } from "./event";
import type { CommandInfo } from "./command";
import type { FileContent, FileNode, VcsFileDiff } from "./files";
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
  sessionId?: CanonicalSessionId;
  signal?: AbortSignal;
}

export interface ProviderSessionInput {
  sessionId?: CanonicalSessionId;
  directory?: string;
  parentId?: string;
  title?: string;
  agentId?: string;
  model?: { providerId: string; modelId: string };
  metadata?: Record<string, unknown>;
  messageId?: string;
}

export interface ProviderMessagesInput {
  sessionId: CanonicalSessionId;
  directory?: string;
  limit?: number;
  before?: string;
}

export interface ProviderMessagePage {
  messages: ChatMessage[];
  nextCursor?: string;
}

/**
 * Adapters expose canonical session IDs. A provider with directory-scoped native
 * IDs must reversibly namespace them for every session operation and event.
 */
export interface ProviderAdapter {
  readonly id: string;
  readonly capabilities: ProviderCapabilities;
  getInfo(): Promise<ProviderInfo>;
  listSessions?(input: {
    directory?: string;
    limit?: number;
  }): Promise<ChatSession[]>;
  getSession?(input: {
    sessionId: CanonicalSessionId;
    directory?: string;
  }): Promise<ChatSession>;
  getSessionChildren?(input: {
    sessionId: CanonicalSessionId;
    directory?: string;
  }): Promise<ChatSession[]>;
  getSessionStatuses?(input: {
    directory?: string;
  }): Promise<Record<string, RunStatus>>;
  listMessages?(input: ProviderMessagesInput): Promise<ProviderMessagePage>;
  createSession?(input: ProviderSessionInput): Promise<ChatSession>;
  updateSession?(input: ProviderSessionInput): Promise<ChatSession>;
  deleteSession?(input: {
    sessionId: CanonicalSessionId;
    directory?: string;
  }): Promise<void>;
  forkSession?(input: ProviderSessionInput): Promise<ChatSession>;
  abortSession?(input: {
    sessionId: CanonicalSessionId;
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
  listFiles?(input: { directory: string; path: string }): Promise<FileNode[]>;
  readFile?(input: { directory: string; path: string }): Promise<FileContent>;
  searchFiles?(input: {
    directory: string;
    query: string;
    limit?: number;
  }): Promise<string[]>;
  listDiff?(input: { directory: string }): Promise<VcsFileDiff[]>;
  listCommands?(input: { directory: string }): Promise<CommandInfo[]>;
  executeCommand?(input: {
    sessionId: CanonicalSessionId;
    command: string;
    arguments?: string;
    directory: string;
  }): Promise<unknown>;
  subscribeEvents(input?: ProviderEventsInput): AsyncIterable<ChatEvent>;
}
