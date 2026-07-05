import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface LastSessionState {
    lastSessions: Record<string, string>;
    setLastSession: (workspaceId: string, sessionId: string) => void;
    getLastSession: (workspaceId: string) => string | undefined;
    clearLastSession: (workspaceId: string) => void;
}

export const useLastSessionStore = create<LastSessionState>()(
    persist(
        (set, get) => ({
            lastSessions: {},
            setLastSession: (workspaceId, sessionId) => {
                set((state) => ({
                    lastSessions: { ...state.lastSessions, [workspaceId]: sessionId },
                }));
            },
            getLastSession: (workspaceId) => get().lastSessions[workspaceId],
            clearLastSession: (workspaceId) => {
                set((state) => {
                    const next = { ...state.lastSessions };
                    delete next[workspaceId];
                    return { lastSessions: next };
                });
            },
        }),
        {
            name: "cloudy-last-sessions",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
