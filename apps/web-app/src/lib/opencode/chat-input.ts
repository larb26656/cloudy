export interface MentionAttrs {
    id: string;
    label: string | null;
    mentionSuggestionChar: string;
}

export interface ChatInputContent {
    text: string;
    mentions: MentionAttrs[];
}