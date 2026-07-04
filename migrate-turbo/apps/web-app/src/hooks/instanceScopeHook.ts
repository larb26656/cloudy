import { resolveInstance, type AppStores, type AppStoreState, type InstanceDetail } from "@/lib/instance-registry";
import type { OCClient } from "@/lib/opencode";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export function useCurrentInstanceId(): string {
    const workspace = useWorkspaceStore.getState().getCurrentWorkspace();
    if (!workspace) throw new Error("No current workspace");
    return workspace.instanceId;
}

export function useCurrentInstance(): InstanceDetail {
    return resolveInstance(useCurrentInstanceId());
}

export function useIStore<K extends keyof AppStores>(key: K): AppStoreState[K];
export function useIStore<K extends keyof AppStores, T>(key: K, selector: (state: AppStoreState[K]) => T): T;
export function useIStore<K extends keyof AppStores, T>(key: K, selector: (state: AppStoreState[K]) => T, instanceId: string): T;
export function useIStore<K extends keyof AppStores, T>(
    key: K,
    selector?: (state: AppStoreState[K]) => T,
    instanceId?: string
): AppStoreState[K] | T {
    const currentInstanceId = useCurrentInstanceId();
    const instance = resolveInstance(instanceId ?? currentInstanceId);
    const state = instance.stores[key]() as AppStoreState[K];
    return selector ? selector(state) : state;
}

export const useStore = useIStore;

export function getStore<K extends keyof AppStores>(key: K, instanceId: string): AppStores[K] {
    const instance = resolveInstance(instanceId);
    if (!instance) throw new Error(`Instance id: ${instanceId} not registered!`);
    return instance.stores[key];
}

export function getOC(instanceId: string): OCClient {
    const instance = resolveInstance(instanceId);
    if (!instance) throw new Error(`Instance id: ${instanceId} not registered!`);
    return instance.oc;
}