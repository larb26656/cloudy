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
}

export interface ToolMessagePart extends MessagePartBase {
  type: "tool";
  toolName: string;
  callId?: string;
  status: "pending" | "running" | "completed" | "failed";
  input?: unknown;
  output?: unknown;
  error?: string;
}

export interface FileMessagePart extends MessagePartBase {
  type: "file";
  path: string;
  action?: "read" | "write" | "edit" | "delete";
  mimeType?: string;
  content?: string;
  url?: string;
}

export interface DiffMessagePart extends MessagePartBase {
  type: "diff";
  path: string;
  patch: string;
  before?: string;
  after?: string;
}

export interface SubtaskMessagePart extends MessagePartBase {
  type: "subtask";
  sessionId?: string;
  description: string;
  status?: RunStatus;
}

export interface CompactionMessagePart extends MessagePartBase {
  type: "compaction";
  summary?: string;
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
}
