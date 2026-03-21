import type { AssistantMessage, Message as OpencodeMessage, Part, UserMessage } from "@opencode-ai/sdk/v2";

export interface Message {
    info: OpencodeMessage;
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