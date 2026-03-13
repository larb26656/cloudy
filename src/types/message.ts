// types/message.ts

export type MessageRole = 'user' | 'assistant';

export interface Message {
  info: MessageInfo;
  parts: Part[];
}

export interface MessageInfo {
  id: string;
  sessionID: string;
  role: MessageRole;
  time: {
    created: number;
    completed?: number;
  };
  parentID?: string;
  model?: {
    providerID: string;
    modelID: string;
  };
  agent?: string;
  variant?: string;
  format?: OutputFormat;
  system?: string;
  summary?: {
    title: string;
    body: string;
    diffs: string[];
  };
  tools?: Record<string, boolean>;
  cost?: number;
  tokens?: TokenUsage;
  structured?: unknown;
  finish?: string;
  error?: ApiError;
  mode?: string;
  path?: {
    cwd: string;
    root: string;
  };
}

export interface TokenUsage {
  total: number;
  input: number;
  output: number;
  reasoning: number;
  cache: {
    read: number;
    write: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
}

export interface OutputFormat {
  type: 'json';
  schema: unknown;
}

// Part Types
export type PartType =
  | 'text'
  | 'reasoning'
  | 'tool'
  | 'file'
  | 'agent'
  | 'subtask'
  | 'stepStart'
  | 'stepFinish'
  | 'snapshot'
  | 'patch'
  | 'retry'
  | 'compaction';

export type Part =
  | TextPart
  | ReasoningPart
  | FilePart
  | ToolPart;

export interface BasePart {
  id: string;
  sessionID: string;
  messageID: string;
  type: PartType;
  time: {
    start: number;
    end?: number;
  };
  metadata?: Record<string, unknown>;
  synthetic?: boolean;
  ignored?: boolean;
}

export interface TextPart extends BasePart {
  type: 'text';
  text: string;
}

export interface ReasoningPart extends BasePart {
  type: 'reasoning';
  text: string;
}

export interface FilePart extends BasePart {
  type: 'file';
  mime: string;
  url: string;
  filename?: string;
}

export interface ToolPart extends BasePart {
  type: 'tool';
  tool: string;
  command: string;
  arguments?: Record<string, unknown>;
  output?: string;
  result?: unknown;
}

// Input types for sending messages
export interface TextPartInput {
  type: 'text';
  text: string;
  synthetic?: boolean;
  ignored?: boolean;
}

export interface FilePartInput {
  type: 'file';
  mime: string;
  url: string;
  filename?: string;
}

export type PartInput = TextPartInput | FilePartInput;

export interface SendMessageRequest {
  messageID?: string;
  model?: {
    providerID: string;
    modelID: string;
  };
  agent?: string;
  noReply?: boolean;
  system?: string;
  variant?: string;
  format?: OutputFormat;
  parts: PartInput[];
}
