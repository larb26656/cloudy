import type { ChatMessage } from "@repo/ai-core";

export type Message = ChatMessage;
export type UserSessionMessage = ChatMessage;
export type AssistantSessionMessage = ChatMessage;

export interface MessageFileItem {
  name: string;
  path: string;
  type: "write" | "edit";
  content: string;
  originalContent?: string;
}
