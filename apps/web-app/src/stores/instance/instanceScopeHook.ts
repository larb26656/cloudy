import { createModelStore } from "./modelStore";
import { createAgentStore } from "./agentStore";
import { createCommandSuggestionStore } from "./commandSuggestionStore";
import { createFindFileStore } from "./findFileStore";
import { createInstanceActivityStore } from "./instanceActivityStore";
import { createMessageStore } from "./messageStore";
import { createPermissionStore } from "./permissionStore";
import { createQuestionStore } from "./questionStore";
import { createSessionStore } from "./sessionStore";
import { createOpencodeClient, type OpencodeClient } from "@opencode-ai/sdk/v2/client";
import type { AgentStore } from "./agentStore";
import type { ModelStore } from "./modelStore";
import type { MessageStore } from "./messageStore";
import type { SessionStore } from "./sessionStore";
import type { PermissionStore } from "./permissionStore";
import type { QuestionStore } from "./questionStore";
import type { FindFileStore } from "./findFileStore";
import type { CommandSuggestionStore } from "./commandSuggestionStore";
import { useInstanceStore, type Instance } from "../instanceStore";
import type { InstanceActivityStore } from "./instanceActivityStore";

type AppStores = {
    activity: ReturnType<typeof createInstanceActivityStore>;
    agent: ReturnType<typeof createAgentStore>;
    commandSuggestion: ReturnType<typeof createCommandSuggestionStore>;
    findFile: ReturnType<typeof createFindFileStore>;
    message: ReturnType<typeof createMessageStore>;
    model: ReturnType<typeof createModelStore>;
    permission: ReturnType<typeof createPermissionStore>;
    question: ReturnType<typeof createQuestionStore>;
    session: ReturnType<typeof createSessionStore>;
};

type AppStoreState = {
    activity: InstanceActivityStore;
    agent: AgentStore;
    commandSuggestion: CommandSuggestionStore;
    findFile: FindFileStore;
    message: MessageStore;
    model: ModelStore;
    permission: PermissionStore;
    question: QuestionStore;
    session: SessionStore;
};

function createStores(oc: OpencodeClient): AppStores {
    console.log('Create store');
    return {
        activity: createInstanceActivityStore(oc),
        agent: createAgentStore(oc),
        commandSuggestion: createCommandSuggestionStore(oc),
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

export function registerInstance(instance: Instance): InstanceDetail {
    if (instanceRegistry[instance.id]) {
        return instanceRegistry[instance.id];
    }

    const oc = createOpencodeClient({
        baseUrl: instance.endpoint
    });

    const detail = {
        name: instance.name,
        oc,
        stores: createStores(oc)
    };

    instanceRegistry[instance.id] = detail;

    console.log(instanceRegistry);

    return detail;
}

export function getRegisteredInstance(id: string): InstanceDetail | null {
    return instanceRegistry[id] ?? null;
}

export function useCurrentInstanceId(): string {
    const instances = useInstanceStore.getState().instances;
    if (instances.length === 0) {
        throw new Error("No instance available");
    }
    const registered = instanceRegistry[instances[0].id];
    if (registered) {
        return instances[0].id;
    }
    const instanceData = instances[0];
    registerInstance(instanceData);
    return instanceData.id;
}

export function useCurrentInstance(): InstanceDetail {
    const id = useCurrentInstanceId();
    const instance = instanceRegistry[id];

    if (!instance) {
        const store = useInstanceStore.getState();
        const instanceData = store.instances.find(i => i.id === id);
        if (instanceData) {
            return registerInstance(instanceData);
        }
        throw new Error(`Instance id: ${id} not registered!`);
    }

    return instance;
}

export function useIStore<K extends keyof AppStores>(key: K): AppStoreState[K];
export function useIStore<K extends keyof AppStores, T>(key: K, selector: (state: AppStoreState[K]) => T): T;
export function useIStore<K extends keyof AppStores, T>(key: K, selector: (state: AppStoreState[K]) => T, instanceId: string): T;
export function useIStore<K extends keyof AppStores, T>(
    key: K,
    selector?: (state: AppStoreState[K]) => T,
    instanceId?: string
): AppStoreState[K] | T {
    const instance = instanceId
        ? (instanceRegistry[instanceId] ?? (() => { throw new Error(`Instance ${instanceId} not registered`) })())
        : useCurrentInstance();
    const store = instance.stores[key];
    const state = store() as AppStoreState[K];
    if (selector) {
        return selector(state);
    }
    return state;
}

export const useStore = useIStore;

export function getStore<K extends keyof AppStores>(key: K, instanceId: string): AppStores[K] {
    const instance = instanceRegistry[instanceId];
    if (!instance) throw new Error(`Instance id: ${instanceId} not registered!`);
    return instance.stores[key];
}

export function getOC(instanceId: string): OpencodeClient {
    const instance = instanceRegistry[instanceId];
    if (!instance) throw new Error(`Instance id: ${instanceId} not registered!`);
    return instance.oc;
}