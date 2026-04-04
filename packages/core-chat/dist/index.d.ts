export { SdkError, createDefaultTitle, getErrorMessage, getOc, initCoreChat } from './lib.js';
export { C as ChatInputContent, M as MentionAttrs, a as ModelConfig, b as buildParts } from './types-DeKiEcLw.js';
export { BREAKPOINTS, DeviceType, Idea, IdeaMeta, IdeaPriority, IdeaStatus, Memory, MemoryMeta, getDeviceType } from './types.js';
export { AgentStore, ChatUIStore, DirectoryStore, FindFileStore, MemoryStore, MessageStore, ModelStore, PermissionStore, QuestionStore, SessionStore, useAgentStore, useChatUIStore, useDirectoryStore, useFindFileStore, useMemoryStore, useMessageStore, useModelStore, usePermissionStore, useQuestionStore, useSessionStore } from './stores.js';
export { Agent, Message, Part, Session, SessionMessagesResponse } from '@opencode-ai/sdk/v2';
import '@opencode-ai/sdk/v2/client';
import 'zustand';
import 'zustand/middleware';

interface FrontMatterMeta {
    title?: string;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
}
type ArtifactType = 'html' | 'pdf' | 'image' | 'video' | 'document';
type IdeaStatus = 'draft' | 'in-progress' | 'completed' | 'archived';
type IdeaPriority = 'low' | 'medium' | 'high';
interface ArtifactFrontMatterMeta extends FrontMatterMeta {
    type?: ArtifactType;
}
interface IdeaFrontMatterMeta extends FrontMatterMeta {
    status?: IdeaStatus;
    priority?: IdeaPriority;
}
interface ParsedMarkdown {
    meta: FrontMatterMeta;
    content: string;
    raw: string;
}
declare function parseFrontMatter(markdown: string, fallbackTitle?: string): ParsedMarkdown;
declare function parseIdeaFrontMatter(markdown: string, fallbackTitle?: string): {
    meta: IdeaFrontMatterMeta;
    content: string;
    raw: string;
};
declare function parseArtifactFrontMatter(markdown: string, fallbackTitle?: string): {
    meta: ArtifactFrontMatterMeta;
    content: string;
    raw: string;
};
declare function stringifyFrontMatter(meta: FrontMatterMeta, content: string): string;
declare function stringifyArtifactFrontMatter(meta: ArtifactFrontMatterMeta, content: string): string;
declare function stringifyIdeaFrontMatter(meta: IdeaFrontMatterMeta, content: string): string;

export { type ArtifactFrontMatterMeta, type ArtifactType, type FrontMatterMeta, type IdeaFrontMatterMeta, type ParsedMarkdown, parseArtifactFrontMatter, parseFrontMatter, parseIdeaFrontMatter, stringifyArtifactFrontMatter, stringifyFrontMatter, stringifyIdeaFrontMatter };
