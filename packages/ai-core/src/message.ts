import type { RunStatus } from "./session";

export interface MessagePartBase {
  id: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface TextMessagePart extends MessagePartBase {
  type: "text";
  text: string;
}

export interface ReasoningMessagePart extends MessagePartBase {
  type: "reasoning";
  text: string;
  startedAt?: number;
  completedAt?: number;
}

export interface ToolAttachment {
  id: string;
  filename?: string;
  url?: string;
}

export interface ToolMessagePartState {
  status: "pending" | "running" | "completed" | "error";
  title?: string;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  attachments?: ToolAttachment[];
  metadata?: Record<string, unknown>;
}

export interface ToolMessagePart extends MessagePartBase {
  type: "tool";
  toolName: string;
  callId?: string;
  status: "pending" | "running" | "completed" | "failed";
  input?: unknown;
  output?: unknown;
  error?: string;
  state?: ToolMessagePartState;
}

export interface FileMessagePart extends MessagePartBase {
  type: "file";
  path: string;
  action?: "read" | "write" | "edit" | "delete";
  mimeType?: string;
  content?: string;
  url?: string;
  filename?: string;
  source?: FileMessagePartSource;
}

export type FileMessagePartSource =
  | { type: "file"; path: string; text: { start: number; end: number } }
  | { type: "symbol"; path: string; range: { start: { line: number } } };

export interface DiffMessagePart extends MessagePartBase {
  type: "diff";
  path: string;
  patch: string;
  before?: string;
  after?: string;
  hash?: string;
  files?: string[];
}

export interface SubtaskMessagePart extends MessagePartBase {
  type: "subtask";
  sessionId?: string;
  description: string;
  status?: RunStatus;
  agent?: string;
  prompt?: string;
}

export interface CompactionMessagePart extends MessagePartBase {
  type: "compaction";
  summary?: string;
  automatic?: boolean;
}

export interface StepStartMessagePart extends MessagePartBase {
  type: "step-start";
  snapshot?: string;
}

export interface StepFinishMessagePart extends MessagePartBase {
  type: "step-finish";
  reason: string;
  cost: number;
  tokens: {
    input: number;
    output: number;
    reasoning: number;
    cache: { read: number; write: number };
  };
}

export interface SnapshotMessagePart extends MessagePartBase {
  type: "snapshot";
  snapshot: string;
}

export interface AgentMessagePart extends MessagePartBase {
  type: "agent";
  name: string;
  source?: { value: string; start: number; end: number };
}

export interface RetryMessagePart extends MessagePartBase {
  type: "retry";
  attempt: number;
  error: { message?: string; statusCode?: number };
}

export interface UnknownMessagePart extends MessagePartBase {
  type: "unknown";
  providerType: string;
  data?: unknown;
}

export type MessagePart =
  | TextMessagePart
  | ReasoningMessagePart
  | ToolMessagePart
  | FileMessagePart
  | DiffMessagePart
  | SubtaskMessagePart
  | CompactionMessagePart
  | StepStartMessagePart
  | StepFinishMessagePart
  | SnapshotMessagePart
  | AgentMessagePart
  | RetryMessagePart
  | UnknownMessagePart;

export type ChatMessageRole = "user" | "assistant" | "system" | "tool";

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  parts: MessagePart[];
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
  error?: MessageError;
}

export interface MessageError {
  name: string;
  message?: string;
  data: {
    message?: string;
    retries?: number;
    statusCode?: number;
    [key: string]: unknown;
  };
}
