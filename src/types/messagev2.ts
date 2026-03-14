import type { AssistantMessage, Message, Part, UserMessage } from "@opencode-ai/sdk/v2";

export interface MessageV2 {
    info: Message;
    parts: Array<Part>;
}

export interface UserSessionMessage {
    info: UserMessage;
    parts: Array<Part>;
}

export interface AssistantSessionMessage {
    info: AssistantMessage;
    parts: Array<Part>;
}