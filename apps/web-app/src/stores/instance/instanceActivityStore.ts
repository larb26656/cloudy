import { create } from "zustand";
import type { OpencodeClient } from "@opencode-ai/sdk/v2";

const HEARTBEAT_TIMEOUT_MS = 30_000;

type CurrentActivity = {
    sessionId: string;
    agentName: string;
    description: string;
};

type InstanceActivityState = {
    isHealthy: boolean;
    isBusy: boolean;
    activeAgents: string[];
    currentActivity: CurrentActivity | null;
};

type InstanceActivityActions = {
    setHealthy: () => void;
    setUnhealthy: () => void;
    setBusy: (sessionId: string, agentName: string, description: string) => void;
    setIdle: () => void;
    setCurrentActivity: (activity: CurrentActivity | null) => void;
    addActiveAgent: (agentName: string) => void;
    removeActiveAgent: (agentName: string) => void;
};

export type InstanceActivityStore = InstanceActivityState & InstanceActivityActions;

const heartbeatTimers: Record<string, ReturnType<typeof setTimeout>> = {};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createInstanceActivityStore = (_oc: OpencodeClient) => create<InstanceActivityStore>()(
    (set) => ({
        isHealthy: false,
        isBusy: false,
        activeAgents: [],
        currentActivity: null,

        setHealthy: () => {
            set({ isHealthy: true });
        },

        setUnhealthy: () => {
            set({ isHealthy: false });
        },

        setBusy: (sessionId: string, agentName: string, description: string) => {
            set({
                isBusy: true,
                currentActivity: { sessionId, agentName, description },
            });
        },

        setIdle: () => {
            set({
                isBusy: false,
                activeAgents: [],
                currentActivity: null,
            });
        },

        setCurrentActivity: (activity: CurrentActivity | null) => {
            set({ currentActivity: activity });
        },

        addActiveAgent: (agentName: string) => {
            set((state) => {
                if (state.activeAgents.includes(agentName)) {
                    return state;
                }
                return { activeAgents: [...state.activeAgents, agentName] };
            });
        },

        removeActiveAgent: (agentName: string) => {
            set((state) => ({
                activeAgents: state.activeAgents.filter((a) => a !== agentName),
            }));
        },
    }),
);

export function setHeartbeatTimer(instanceId: string, onUnhealthy: () => void) {
    if (heartbeatTimers[instanceId]) {
        clearTimeout(heartbeatTimers[instanceId]);
    }
    heartbeatTimers[instanceId] = setTimeout(() => {
        onUnhealthy();
    }, HEARTBEAT_TIMEOUT_MS);
}

export function clearHeartbeatTimer(instanceId: string) {
    if (heartbeatTimers[instanceId]) {
        clearTimeout(heartbeatTimers[instanceId]);
        delete heartbeatTimers[instanceId];
    }
}
