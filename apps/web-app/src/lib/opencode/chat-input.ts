export interface MentionAttrs {
  id: string;
  label: string | null;
  mentionSuggestionChar: string;
}

export interface ImageAttachment {
  id: string;
  mime: string;
  filename: string;
  dataUrl: string;
}

export interface ChatInputContent {
  text: string;
  mentions: MentionAttrs[];
  attachments: ImageAttachment[];
}

export type PromptPart =
  | { type: "text"; text: string }
  | { type: "file"; mime: string; url: string; filename: string };

export function buildPromptParts(
  directory: string,
  content: ChatInputContent,
): PromptPart[] {
  const mentions = content.mentions.map((mention) => ({
    type: "file" as const,
    mime: "text/plain",
    url: `file://${directory}/${mention.id}`,
    filename: mention.id,
  }));
  const attachments = content.attachments.map((attachment) => ({
    type: "file" as const,
    mime: attachment.mime,
    url: attachment.dataUrl,
    filename: attachment.filename,
  }));
  return [{ type: "text", text: content.text }, ...mentions, ...attachments];
}
