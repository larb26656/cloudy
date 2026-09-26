export interface MessageAttachment {
  id?: string;
  name: string;
  mimeType?: string;
  size?: number;
  url?: string;
  data?: unknown;
}

export interface SendMessageInput {
  sessionId: string;
  content: string;
  attachments?: MessageAttachment[];
  model?: { providerId: string; modelId: string };
  agentId?: string;
  metadata?: Record<string, unknown>;
}

export interface ApprovalOption {
  id: string;
  label: string;
  description?: string;
}

export interface ApprovalRequest {
  id: string;
  sessionId: string;
  message: string;
  options: ApprovalOption[];
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface QuestionOption {
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  prompt: string;
  options?: QuestionOption[];
  required?: boolean;
}

export interface QuestionRequest {
  id: string;
  sessionId: string;
  questions: Question[];
  expiresAt?: string;
}

export interface InteractionResponse {
  interactionId: string;
  value: unknown;
}
