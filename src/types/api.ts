// types/api.ts

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

export interface CreateSessionRequest {
  parentID?: string;
  title?: string;
  permission?: PermissionRuleset;
}

export interface UpdateSessionRequest {
  title?: string;
  archived?: boolean;
  directory?: string;
}

export interface ForkSessionRequest {
  messageID: string;
  title?: string;
}

import type { PermissionRuleset } from './session';
import type { ApiError } from './message';

// Event Types for Server-Sent Events
export type EventType =
  | 'message.updated'
  | 'message.removed'
  | 'message.part.updated'
  | 'message.part.delta'
  | 'message.part.removed'
  | 'session.created'
  | 'session.updated'
  | 'session.deleted'
  | 'session.status'
  | 'session.idle'
  | 'session.compacted'
  | 'session.error'
  | 'reasoning.start'
  | 'reasoning.delta'
  | 'reasoning.complete'
  | 'tool.start'
  | 'tool.progress'
  | 'tool.complete'
  | 'tool.error'
  | 'ping';

export interface BaseEvent {
  event: EventType;
  type?: string;
}

export interface MessageUpdatedEvent extends BaseEvent {
  event: 'message.updated';
  sessionID: string;
  message: unknown;
}

export interface MessageRemovedEvent extends BaseEvent {
  event: 'message.removed';
  sessionID: string;
  messageID: string;
}

export interface MessagePartUpdatedEvent extends BaseEvent {
  event: 'message.part.updated';
  sessionID: string;
  messageID: string;
  part: unknown;
}

export interface MessagePartDeltaEvent extends BaseEvent {
  event: 'message.part.delta';
  sessionID: string;
  messageID: string;
  partID: string;
  delta: string;
}

export interface MessagePartRemovedEvent extends BaseEvent {
  event: 'message.part.removed';
  sessionID: string;
  messageID: string;
  partID: string;
}

export interface SessionCreatedEvent extends BaseEvent {
  event: 'session.created';
  session: unknown;
}

export interface SessionUpdatedEvent extends BaseEvent {
  event: 'session.updated';
  session: unknown;
}

export interface SessionDeletedEvent extends BaseEvent {
  event: 'session.deleted';
  sessionID: string;
}

export interface SessionStatusEvent extends BaseEvent {
  event: 'session.status';
  sessionID: string;
  status: unknown;
}

export interface SessionIdleEvent extends BaseEvent {
  event: 'session.idle';
  sessionID: string;
}

export interface SessionCompactedEvent extends BaseEvent {
  event: 'session.compacted';
  sessionID: string;
}

export interface SessionErrorEvent extends BaseEvent {
  event: 'session.error';
  sessionID: string;
  error: ApiError;
}

// Phase 2: Reasoning Events
export interface ReasoningStartEvent extends BaseEvent {
  event: 'reasoning.start';
  sessionID: string;
  messageID: string;
}

export interface ReasoningDeltaEvent extends BaseEvent {
  event: 'reasoning.delta';
  sessionID: string;
  messageID: string;
  text: string;
}

export interface ReasoningCompleteEvent extends BaseEvent {
  event: 'reasoning.complete';
  sessionID: string;
  messageID: string;
}

// Phase 2: Tool Events
export interface ToolStartEvent extends BaseEvent {
  event: 'tool.start';
  sessionID: string;
  messageID: string;
  partID: string;
  tool: string;
  arguments: Record<string, unknown>;
}

export interface ToolProgressEvent extends BaseEvent {
  event: 'tool.progress';
  sessionID: string;
  messageID: string;
  partID: string;
  progress: number;
  status: string;
}

export interface ToolCompleteEvent extends BaseEvent {
  event: 'tool.complete';
  sessionID: string;
  messageID: string;
  partID: string;
  result?: unknown;
}

export interface ToolErrorEvent extends BaseEvent {
  event: 'tool.error';
  sessionID: string;
  messageID: string;
  partID: string;
  error: string;
}

export interface PingEvent extends BaseEvent {
  event: 'ping';
}

export type ApiEvent =
  | MessageUpdatedEvent
  | MessageRemovedEvent
  | MessagePartUpdatedEvent
  | MessagePartDeltaEvent
  | MessagePartRemovedEvent
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | SessionDeletedEvent
  | SessionStatusEvent
  | SessionIdleEvent
  | SessionCompactedEvent
  | SessionErrorEvent
  | ReasoningStartEvent
  | ReasoningDeltaEvent
  | ReasoningCompleteEvent
  | ToolStartEvent
  | ToolProgressEvent
  | ToolCompleteEvent
  | ToolErrorEvent
  | PingEvent;

// List sessions query params
export interface ListSessionsParams {
  directory?: string;
  roots?: boolean;
  start?: number;
  search?: string;
  limit?: number;
}

// Model API Types
export interface ListModelsResponse {
  providers: {
    id: string;
    name: string;
    models: {
      id: string;
      name: string;
      description?: string;
      maxTokens?: number;
      supportsStreaming: boolean;
      supportsTools: boolean;
    }[];
  }[];
}

// Directory API Types
export interface ValidateDirectoryResponse {
  valid: boolean;
  error?: string;
}

export interface ListDirectoryResponse {
  files: {
    name: string;
    path: string;
    size: number;
    lastModified: number;
  }[];
  directories: {
    name: string;
    path: string;
  }[];
}

export interface SearchFilesResponse {
  results: {
    path: string;
    name: string;
    size: number;
    lastModified: number;
  }[];
}

export interface ReadFileResponse {
  content: string;
  size: number;
  encoding: string;
}
