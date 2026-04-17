import { createAgentStore } from "@/stores/instance/agentStore";
import { createCommandSuggestionStore } from "@/stores/instance/commandSuggestionStore";
import { createFindFileStore } from "@/stores/instance/findFileStore";
import { createInstanceActivityStore } from "@/stores/instance/instanceActivityStore";
import { createMessageStore } from "@/stores/instance/messageStore";
import { createModelStore } from "@/stores/instance/modelStore";
import { createPermissionStore } from "@/stores/instance/permissionStore";
import { createQuestionStore } from "@/stores/instance/questionStore";
import { createSessionStore } from "@/stores/instance/sessionStore";
import { createOcClient, type OCClient } from "./opencode";
import { useInstanceStore, type Instance } from "@/stores/instanceStore";
import type { StoreApi, UseBoundStore } from "zustand";

const storeFactories = {
    activity: createInstanceActivityStore,
    agent: createAgentStore,
    commandSuggestion: createCommandSuggestionStore,
    findFile: createFindFileStore,
    message: createMessageStore,
    model: createModelStore,
    permission: createPermissionStore,
    question: createQuestionStore,
    session: createSessionStore,
};

type StoreFactories = typeof storeFactories;


export type AppStores = {
    [K in keyof StoreFactories]: ReturnType<StoreFactories[K]>;
};

/**
 * Extract state from Zustand store
 */

type ExtractStoreState<T> =
    T extends UseBoundStore<StoreApi<infer S>>
    ? S
    : never;

export type AppStoreState = {

    [K in keyof AppStores]: ExtractStoreState<AppStores[K]>;

};

function createStores(oc: OCClient): AppStores {

    const entries = Object.entries(storeFactories).map(([key, factory]) => {

        return [key, factory(oc)];

    });

    return Object.fromEntries(entries) as AppStores;

}

export type InstanceDetail = {
    name: string;
    oc: OCClient,
    stores: AppStores
}

const instanceRegistry: Record<string, InstanceDetail> = {};

export function registerInstance(instance: Instance): InstanceDetail {
    if (instanceRegistry[instance.id]) {
        return instanceRegistry[instance.id];
    }

    const oc = createOcClient({
        baseUrl: instance.endpoint
    });

    const detail = {
        name: instance.name,
        oc,
        stores: createStores(oc)
    };

    instanceRegistry[instance.id] = detail;

    return detail;
}

export function deleteInstance(id: string) {
    delete instanceRegistry[id];
}

export function resolveInstance(id: string,): InstanceDetail {
    const cached = instanceRegistry[id];
    if (cached) return cached;
    const instanceData = useInstanceStore.getState().getInstance(id);
    if (!instanceData) throw new Error(`Instance ${id} not found`);
    return registerInstance(instanceData);
}