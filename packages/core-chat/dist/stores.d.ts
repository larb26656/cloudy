import * as zustand from 'zustand';
import { SessionMessagesResponse, Message, Part, Session, SessionStatus, QuestionRequest, Agent, PermissionRequest } from '@opencode-ai/sdk/v2';
import { C as ChatInputContent, a as ModelConfig } from './types-DeKiEcLw.js';
import * as zustand_middleware from 'zustand/middleware';
import { DeviceType, Memory } from './types.js';

type MessageStoreState = {
    messages: Record<string, SessionMessagesResponse>;
    streamingMessageIds: Record<string, string | null>;
    isLoading: boolean;
    error: string | null;
    isThinking: boolean;
    thinkingContent: Record<string, string>;
    thinkingState: Record<string, 'active' | 'complete' | null>;
};
type MessageStoreSessionActions = {
    loadMessages: (sessionId: string) => Promise<void>;
    sendMessage: (directory: string, sessionId: string, content: ChatInputContent, model?: ModelConfig | null, agent?: string | null) => Promise<void>;
    abortGeneration: (directory: string, sessionId: string) => Promise<void>;
    appendStreamChunk: (sessionId: string, messageId: string, delta: string) => void;
    updateMessage: (message: Message) => void;
    updateMessagePart: (part: Part) => void;
    clearMessages: (sessionId: string) => void;
};
type MessageStore = MessageStoreState & MessageStoreSessionActions;
declare const useMessageStore: zustand.UseBoundStore<zustand.StoreApi<MessageStore>>;

type SessionStoreState = {
    sessions: Session[];
    selectedSessionId: string | null;
    sessionStatuses: Record<string, SessionStatus>;
    isLoading: boolean;
    error: string | null;
    activeQuestion: QuestionRequest | null;
};
type SessionsStoreSessionActions = {
    loadSessions: (directory: string) => Promise<void>;
    createSession: (directory: string, title?: string) => Promise<Session>;
    createTempSession: () => void;
    setCreateSession: (session: Session) => void;
    selectSession: (sessionId: string) => void;
    updateSession: (sessionId: string, title: string) => Promise<void>;
    deleteSession: (sessionId: string) => Promise<void>;
    forkSession: (sessionId: string, messageId: string) => Promise<Session | null>;
    updateSessionStatus: (sessionId: string, status: SessionStatus) => void;
    updateSessionFromEvent: (session: Session) => void;
    addSession: (session: Session) => void;
    removeSession: (sessionId: string) => void;
    setActiveQuestion: (question: QuestionRequest | null) => void;
    clearActiveQuestion: () => void;
};
type SessionStore = SessionStoreState & SessionsStoreSessionActions;
declare const useSessionStore: zustand.UseBoundStore<zustand.StoreApi<SessionStore>>;

type AgentStoreState = {
    selectedAgent: string | null;
    agents: Agent[];
    isLoading: boolean;
    error: string | null;
};
type AgentStoreActions = {
    setSelectedAgent: (agent: string | null) => void;
    fetchAgents: () => Promise<void>;
};
type AgentStore = AgentStoreState & AgentStoreActions;
declare const useAgentStore: zustand.UseBoundStore<Omit<zustand.StoreApi<AgentStore>, "setState" | "persist"> & {
    setState(partial: AgentStore | Partial<AgentStore> | ((state: AgentStore) => AgentStore | Partial<AgentStore>), replace?: false | undefined): unknown;
    setState(state: AgentStore | ((state: AgentStore) => AgentStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<zustand_middleware.PersistOptions<AgentStore, {
            selectedAgent: string | null;
        }, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AgentStore) => void) => () => void;
        onFinishHydration: (fn: (state: AgentStore) => void) => () => void;
        getOptions: () => Partial<zustand_middleware.PersistOptions<AgentStore, {
            selectedAgent: string | null;
        }, unknown>>;
    };
}>;

interface ModelProvider {
    id: string;
    name: string;
    models: ModelConfig[];
}
type ModelStoreState = {
    selectedModel: ModelConfig | null;
    providers: ModelProvider[];
    isLoading: boolean;
    error: string | null;
};
type ModelStoreActions = {
    setSelectedModel: (model: ModelConfig | null) => void;
    fetchProviders: () => Promise<void>;
};
type ModelStore = ModelStoreState & ModelStoreActions;
declare const useModelStore: zustand.UseBoundStore<Omit<zustand.StoreApi<ModelStore>, "setState" | "persist"> & {
    setState(partial: ModelStore | Partial<ModelStore> | ((state: ModelStore) => ModelStore | Partial<ModelStore>), replace?: false | undefined): unknown;
    setState(state: ModelStore | ((state: ModelStore) => ModelStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<zustand_middleware.PersistOptions<ModelStore, {
            selectedModel: ModelConfig | null;
        }, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: ModelStore) => void) => () => void;
        onFinishHydration: (fn: (state: ModelStore) => void) => () => void;
        getOptions: () => Partial<zustand_middleware.PersistOptions<ModelStore, {
            selectedModel: ModelConfig | null;
        }, unknown>>;
    };
}>;

type QuestionStoreState = {
    questions: Record<string, QuestionRequest[]>;
    isLoading: boolean;
    error: string | null;
    dismissed: boolean;
};
type QuestionStoreActions = {
    loadQuestions: (directory: string) => Promise<void>;
    replyQuestion: (requestID: string, answers: string[][], directory: string) => Promise<void>;
    rejectQuestion: (requestID: string, directory: string) => Promise<void>;
    dismissNotification: () => void;
    restoreNotification: () => void;
    clearQuestionsForSession: (sessionId: string) => void;
    removeQuestion: (sessionId: string, requestId: string) => void;
    addQuestion: (question: QuestionRequest) => void;
};
type QuestionStore = QuestionStoreState & QuestionStoreActions;
declare const useQuestionStore: zustand.UseBoundStore<Omit<zustand.StoreApi<QuestionStore>, "setState" | "persist"> & {
    setState(partial: QuestionStore | Partial<QuestionStore> | ((state: QuestionStore) => QuestionStore | Partial<QuestionStore>), replace?: false | undefined): unknown;
    setState(state: QuestionStore | ((state: QuestionStore) => QuestionStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<zustand_middleware.PersistOptions<QuestionStore, {
            dismissed: boolean;
        }, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: QuestionStore) => void) => () => void;
        onFinishHydration: (fn: (state: QuestionStore) => void) => () => void;
        getOptions: () => Partial<zustand_middleware.PersistOptions<QuestionStore, {
            dismissed: boolean;
        }, unknown>>;
    };
}>;

type ChatUIStoreState = {
    deviceType: DeviceType;
    sidebarOpen: boolean;
    sidebarWidth: number;
    isDarkMode: boolean;
};
type ChatUIStoreActions = {
    setDeviceType: (deviceType: DeviceType) => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setSidebarWidth: (width: number) => void;
    toggleTheme: () => void;
};
type ChatUIStore = ChatUIStoreState & ChatUIStoreActions;
declare const useChatUIStore: zustand.UseBoundStore<Omit<zustand.StoreApi<ChatUIStore>, "setState" | "persist"> & {
    setState(partial: ChatUIStore | Partial<ChatUIStore> | ((state: ChatUIStore) => ChatUIStore | Partial<ChatUIStore>), replace?: false | undefined): unknown;
    setState(state: ChatUIStore | ((state: ChatUIStore) => ChatUIStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<zustand_middleware.PersistOptions<ChatUIStore, {
            sidebarOpen: boolean;
            sidebarWidth: number;
            isDarkMode: boolean;
        }, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: ChatUIStore) => void) => () => void;
        onFinishHydration: (fn: (state: ChatUIStore) => void) => () => void;
        getOptions: () => Partial<zustand_middleware.PersistOptions<ChatUIStore, {
            sidebarOpen: boolean;
            sidebarWidth: number;
            isDarkMode: boolean;
        }, unknown>>;
    };
}>;

type DirectoryStoreState = {
    directories: string[];
    selectedDirectory: string | null;
    recentDirectories: string[];
    isLoading: boolean;
    error: string | null;
};
type DirectoryStoreActions = {
    setSelectedDirectory: (directory: string | null) => void;
    addRecentDirectory: (directory: string) => void;
    searchDirectories: (query: string) => Promise<void>;
};
type DirectoryStore = DirectoryStoreState & DirectoryStoreActions;
declare const useDirectoryStore: zustand.UseBoundStore<Omit<zustand.StoreApi<DirectoryStore>, "setState" | "persist"> & {
    setState(partial: DirectoryStore | Partial<DirectoryStore> | ((state: DirectoryStore) => DirectoryStore | Partial<DirectoryStore>), replace?: false | undefined): unknown;
    setState(state: DirectoryStore | ((state: DirectoryStore) => DirectoryStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<zustand_middleware.PersistOptions<DirectoryStore, {
            selectedDirectory: string | null;
            recentDirectories: string[];
        }, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: DirectoryStore) => void) => () => void;
        onFinishHydration: (fn: (state: DirectoryStore) => void) => () => void;
        getOptions: () => Partial<zustand_middleware.PersistOptions<DirectoryStore, {
            selectedDirectory: string | null;
            recentDirectories: string[];
        }, unknown>>;
    };
}>;

type FindType = "file" | "directory";
type FindFileStoreState = {
    results: string[];
    isLoading: boolean;
    error: string | null;
};
type FindFileStoreActions = {
    searchFiles: (directory: string, query: string, options?: {
        type?: FindType;
        limit?: number;
    }) => Promise<string[]>;
    clearResults: () => void;
};
type FindFileStore = FindFileStoreState & FindFileStoreActions;
declare const useFindFileStore: zustand.UseBoundStore<zustand.StoreApi<FindFileStore>>;

type MemoryStoreState = {
    memories: Memory[];
    selectedMemoryId: string | null;
    isLoading: boolean;
    searchQuery: string;
};
type MemoryStoreActions = {
    loadMemories: () => Promise<void>;
    createMemory: (memory: Omit<Memory, 'id' | 'meta'>) => Memory;
    updateMemory: (id: string, updates: Partial<Memory>) => void;
    deleteMemory: (id: string) => void;
    selectMemory: (id: string | null) => void;
    setSearchQuery: (query: string) => void;
    getFilteredMemories: () => Memory[];
};
type MemoryStore = MemoryStoreState & MemoryStoreActions;
declare const useMemoryStore: zustand.UseBoundStore<zustand.StoreApi<MemoryStore>>;

type PermissionStoreState = {
    permissions: Record<string, PermissionRequest[]>;
    isLoading: boolean;
    error: string | null;
    dismissed: boolean;
};
type PermissionStoreActions = {
    loadPermissions: (directory: string) => Promise<void>;
    replyPermission: (requestID: string, reply: "once" | "always" | "reject", directory: string) => Promise<void>;
    dismissNotification: () => void;
    restoreNotification: () => void;
    clearPermissionsForSession: (sessionId: string) => void;
    removePermission: (sessionId: string, requestId: string) => void;
    addPermission: (permission: PermissionRequest) => void;
};
type PermissionStore = PermissionStoreState & PermissionStoreActions;
declare const usePermissionStore: zustand.UseBoundStore<Omit<zustand.StoreApi<PermissionStore>, "setState" | "persist"> & {
    setState(partial: PermissionStore | Partial<PermissionStore> | ((state: PermissionStore) => PermissionStore | Partial<PermissionStore>), replace?: false | undefined): unknown;
    setState(state: PermissionStore | ((state: PermissionStore) => PermissionStore), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<zustand_middleware.PersistOptions<PermissionStore, {
            dismissed: boolean;
        }, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: PermissionStore) => void) => () => void;
        onFinishHydration: (fn: (state: PermissionStore) => void) => () => void;
        getOptions: () => Partial<zustand_middleware.PersistOptions<PermissionStore, {
            dismissed: boolean;
        }, unknown>>;
    };
}>;

export { type AgentStore, type ChatUIStore, type DirectoryStore, type FindFileStore, type MemoryStore, type MessageStore, type ModelStore, type PermissionStore, type QuestionStore, type SessionStore, useAgentStore, useChatUIStore, useDirectoryStore, useFindFileStore, useMemoryStore, useMessageStore, useModelStore, usePermissionStore, useQuestionStore, useSessionStore };
