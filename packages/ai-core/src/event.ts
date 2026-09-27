import type { PermissionRequest, ProviderQuestionRequest } from "./interaction";
import type { ChatMessage, MessagePart } from "./message";
import type { RunStatus, SessionStatus } from "./session";

export type CanonicalSessionId = string;

export interface ChatEventContext {
  providerId: string;
  directory?: string;
}

export type ProviderConnectionState =
  | "connected"
  | "disconnected"
  | "reconnecting";

export interface ProviderConnectionEvent extends ChatEventContext {
  type: "provider.connection";
  state: ProviderConnectionState;
  error?: unknown;
}

export interface SessionStatusEvent extends ChatEventContext {
  type: "session.status";
  sessionId: CanonicalSessionId;
  status: SessionStatus;
  runStatus?: RunStatus;
}

export interface MessageUpdatedEvent extends ChatEventContext {
  type: "message.updated";
  sessionId: CanonicalSessionId;
  message: ChatMessage;
}

export interface MessagePartUpdatedEvent extends ChatEventContext {
  type: "message.part.updated";
  sessionId: CanonicalSessionId;
  messageId: string;
  part: MessagePart;
}

export interface MessageDeltaEvent extends ChatEventContext {
  type: "message.delta";
  sessionId: CanonicalSessionId;
  messageId: string;
  partId: string;
  delta: string;
}

export interface ApprovalRequestedEvent extends ChatEventContext {
  type: "approval.requested";
  sessionId: CanonicalSessionId;
  request: PermissionRequest;
}

export interface QuestionRequestedEvent extends ChatEventContext {
  type: "question.requested";
  sessionId: CanonicalSessionId;
  request: ProviderQuestionRequest;
}

export interface RunFailedEvent extends ChatEventContext {
  type: "run.failed";
  sessionId: CanonicalSessionId;
  message?: string;
  error?: unknown;
}

export type ChatEvent =
  | ProviderConnectionEvent
  | SessionStatusEvent
  | MessageUpdatedEvent
  | MessagePartUpdatedEvent
  | MessageDeltaEvent
  | ApprovalRequestedEvent
  | QuestionRequestedEvent
  | RunFailedEvent;
