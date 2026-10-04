export type SessionStatusValue =
  | "idle"
  | "active"
  | "paused"
  | "closed"
  | "retry";

export type SessionRunStatusValue =
  | "idle"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface ChatSession {
  id: string;
  providerId: string;
  title?: string;
  parentID?: string;
  directory: string;
  status: SessionStatusValue;
  runStatus: SessionRunStatusValue;
  updatedAt?: number;
  cost?: number;
  tokens?: {
    input: number;
    output: number;
    reasoning: number;
    cache: { read: number; write: number };
  };
}

export interface RecentChatSession extends ChatSession {
  updatedAt: number;
}

export type SessionRunStatus =
  | { type: "idle" }
  | { type: "busy" }
  | { type: "retry"; attempt: number; message: string; next: number };

export interface FileNode {
  name: string;
  path: string;
  absolute: string;
  type: "file" | "directory";
  ignored?: boolean;
}

export interface FileContent {
  type: "text" | "binary";
  content?: string;
}

export type VcsFileStatus = "added" | "modified" | "deleted" | string;

export interface VcsFileDiff {
  file: string;
  additions: number;
  deletions: number;
  status?: VcsFileStatus;
  patch?: string;
}

export interface PermissionRequest {
  id: string;
  sessionID: string;
  permission: string;
  patterns: string[];
  always?: string[];
  tool?: { messageID: string };
}

export interface QuestionOption {
  label: string;
  description?: string;
}

export interface QuestionItem {
  header: string;
  question: string;
  multiple?: boolean;
  options: QuestionOption[];
}

export interface QuestionRequest {
  id: string;
  sessionID: string;
  questions: QuestionItem[];
}

export type QuestionAnswer = string[];

export interface SessionErrorInfo {
  name: string;
  message?: string;
  data: {
    message?: string;
    retries?: number;
    statusCode?: number;
    [key: string]: unknown;
  };
}
