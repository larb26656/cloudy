import { createModelStore } from "./modelStore";
import { createAgentStore } from "./agentStore";
import { createCommandSuggestionStore } from "./commandSuggestionStore";
import { createDirectoryStore } from "./directoryStore";
import { createFindFileStore } from "./findFileStore";
import { createMessageStore } from "./messageStore";
import { createPermissionStore } from "./permissionStore";
import { createQuestionStore } from "./questionStore";
import { createSessionStore } from "./sessionStore";
import { createOpencodeClient, type OpencodeClient } from "@opencode-ai/sdk/v2";
import type { AgentStore } from "./agentStore";
import type { ModelStore } from "./modelStore";
import type { MessageStore } from "./messageStore";
import type { SessionStore } from "./sessionStore";
import type { DirectoryStore } from "./directoryStore";
import type { PermissionStore } from "./permissionStore";
import type { QuestionStore } from "./questionStore";
import type { FindFileStore } from "./findFileStore";
import type { CommandSuggestionStore } from "./commandSuggestionStore";

type AppStores = {
    agent: ReturnType<typeof createAgentStore>;
    commandSuggestion: ReturnType<typeof createCommandSuggestionStore>;
    directory: ReturnType<typeof createDirectoryStore>;
    findFile: ReturnType<typeof createFindFileStore>;
    message: ReturnType<typeof createMessageStore>;
    model: ReturnType<typeof createModelStore>;
    permission: ReturnType<typeof createPermissionStore>;
    question: ReturnType<typeof createQuestionStore>;
    session: ReturnType<typeof createSessionStore>;
};

type AppStoreState = {
    agent: AgentStore;
    commandSuggestion: CommandSuggestionStore;
    directory: DirectoryStore;
    findFile: FindFileStore;
    message: MessageStore;
    model: ModelStore;
    permission: PermissionStore;
    question: QuestionStore;
    session: SessionStore;
};

function createStores(oc: OpencodeClient): AppStores {
    return {
        agent: createAgentStore(oc),
        commandSuggestion: createCommandSuggestionStore(oc),
        directory: createDirectoryStore(oc),
        findFile: createFindFileStore(oc),
        message: createMessageStore(oc),
        model: createModelStore(oc),
        permission: createPermissionStore(oc),
        question: createQuestionStore(oc),
        session: createSessionStore(oc),
    };
}

export type InstanceDetail = {
    name: string;
    oc: OpencodeClient,
    stores: AppStores
}

const instanceRegistry: Record<string, InstanceDetail> = {};

export function register(id: string, name: string, ocEndpoint: string): InstanceDetail {
    const oc = createOpencodeClient({
        baseUrl: ocEndpoint
    });

    const detail = {
        name,
        oc,
        stores: createStores(oc)
    };

    instanceRegistry[id] = detail;

    return detail;
}

export function useCurrentInstanceId() {
    // TODO use context instead
    const id = '1';
    if (!id) throw new Error('Component have declare in instace scope');
    return id;
}

export function useCurrentInstance(): InstanceDetail {
    const id = useCurrentInstanceId();
    const instance = instanceRegistry[id];

    if (!instance) throw new Error(`Instance id: ${id} not registered!`);

    return instance;
}

export function useIStore<K extends keyof AppStores>(key: K): AppStoreState[K] & { getState: () => AppStoreState[K] } {
    const store = useCurrentInstance().stores[key];
    const state = store() as AppStoreState[K];
    return {
        ...state,
        getState: () => state,
    };
}

export const useStore = useIStore;

export function getStore<K extends keyof AppStores>(key: K): AppStores[K] {
    const id = '1'; // TODO: match useCurrentInstanceId logic without hooks
    const instance = instanceRegistry[id];
    if (!instance) throw new Error(`Instance id: ${id} not registered!`);
    return instance.stores[key];
}

register('1', "fix", "http://localhost:4096");