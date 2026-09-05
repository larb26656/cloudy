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
