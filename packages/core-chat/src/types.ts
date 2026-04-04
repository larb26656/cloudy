import type { Agent, AgentPartInput, FilePartInput, Message, Part, Session, SessionMessagesResponse, SubtaskPartInput, TextPartInput } from "@opencode-ai/sdk/v2";

export interface ModelConfig {
  providerID: string;
  modelID: string;
  name: string;
  description?: string;
  maxTokens?: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
}

export interface MentionAttrs {
  id: string;
  label: string | null;
  mentionSuggestionChar: string;
}

export interface ChatInputContent {
  text: string;
  mentions: MentionAttrs[];
}

export type { Agent, Message, Part, Session, SessionMessagesResponse };

export function buildParts(
  directory: string,
  content: ChatInputContent
): (TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput)[] {
  const textPart: TextPartInput = { type: 'text', text: content.text };

  const mentionParts: FilePartInput[] = content.mentions.map((mention) => {
    const filename = mention.id;
    const path = `${directory}/${filename}`;
    const url = `file://${path}`;

    return {
      type: 'file',
      mime: 'text/plain',
      url,
      filename,
      source: {
        type: "file",
        text: {
          value: filename,
          start: 0,
          end: filename.length
        },
        path
      }
    };
  });

  return [textPart, ...mentionParts];
}
