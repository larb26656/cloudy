import type { AgentReference } from "./agent";
import type { ModelReference } from "./model";

export type RunStatus =
  | "idle"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type SessionStatus =
  | "idle"
  | "active"
  | "paused"
  | "closed"
  | SessionRetryStatus;

export interface SessionRetryStatus {
  type: "retry";
  attempt: number;
  message: string;
  next: number;
}

export interface ChatSession {
  id: string;
  title?: string;
  status: SessionStatus;
  runStatus: RunStatus;
  providerId: string;
  model?: ModelReference;
  agent?: AgentReference;
  createdAt: string;
  updatedAt: string;
  directory?: string;
  parentId?: string;
  cost?: number;
  tokens?: {
    input: number;
    output: number;
    reasoning: number;
    cache: { read: number; write: number };
  };
  metadata?: Record<string, unknown>;
}
