import { TextPartInput, FilePartInput, AgentPartInput, SubtaskPartInput } from '@opencode-ai/sdk/v2';

interface ModelConfig {
    providerID: string;
    modelID: string;
    name: string;
    description?: string;
    maxTokens?: number;
    supportsStreaming: boolean;
    supportsTools: boolean;
}
interface MentionAttrs {
    id: string;
    label: string | null;
    mentionSuggestionChar: string;
}
interface ChatInputContent {
    text: string;
    mentions: MentionAttrs[];
}

declare function buildParts(directory: string, content: ChatInputContent): (TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput)[];

export { type ChatInputContent as C, type MentionAttrs as M, type ModelConfig as a, buildParts as b };
