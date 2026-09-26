import type { ApprovalRequest, QuestionRequest } from "./interaction";
import type { ChatMessage, MessagePart } from "./message";
import type { RunStatus, SessionStatus } from "./session";

export interface SessionStatusEvent {
  type: "session.status";
  sessionId: string;
  status: SessionStatus;
  runStatus?: RunStatus;
}

export interface MessageUpdatedEvent {
  type: "message.updated";
  sessionId: string;
  message: ChatMessage;
}

export interface MessagePartUpdatedEvent {
  type: "message.part.updated";
  sessionId: string;
  messageId: string;
  part: MessagePart;
}

export interface MessageDeltaEvent {
  type: "message.delta";
  sessionId: string;
  messageId: string;
  partId: string;
  delta: string;
}

export interface ApprovalRequestedEvent {
  type: "approval.requested";
  sessionId: string;
  request: ApprovalRequest;
}

export interface QuestionRequestedEvent {
  type: "question.requested";
  sessionId: string;
  request: QuestionRequest;
}

export interface RunFailedEvent {
  type: "run.failed";
  sessionId: string;
  message?: string;
  error?: unknown;
}

export type ChatEvent =
  | SessionStatusEvent
  | MessageUpdatedEvent
  | MessagePartUpdatedEvent
  | MessageDeltaEvent
  | ApprovalRequestedEvent
  | QuestionRequestedEvent
  | RunFailedEvent;
