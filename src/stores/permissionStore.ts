import { getErrorMessage, oc, type SdkError } from "@/lib/opencode";
import type { PermissionRequest } from "@opencode-ai/sdk/v2";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type PermissionStoreState = {
    permissions: Record<string, PermissionRequest[]>;
    isLoading: boolean;
    error: string | null;
    dismissed: boolean;
}

type PermissionStoreActions = {
    loadPermissions: (directory: string) => Promise<void>;
    replyPermission: (requestID: string, reply: "once" | "always" | "reject", directory: string) => Promise<void>;
    dismissNotification: () => void;
    restoreNotification: () => void;
    clearPermissionsForSession: (sessionId: string) => void;
    removePermission: (sessionId: string, requestId: string) => void;
    addPermission: (permission: PermissionRequest) => void;
}

type PermissionStore = PermissionStoreState & PermissionStoreActions

export const usePermissionStore = create<PermissionStore>()(
    persist(
        (set, get) => ({
            permissions: {},
            isLoading: false,
            error: null,
            dismissed: false,

            loadPermissions: async (directory: string) => {
                set({ isLoading: true, error: null });

                const result = await oc.permission.list({ directory });

                if (result.error) {
                    set({ error: getErrorMessage(result.error as SdkError), isLoading: false });
                    return;
                }

                const permissionList = result.data || [];
                const grouped: Record<string, PermissionRequest[]> = {};

                for (const permission of permissionList) {
                    if (!grouped[permission.sessionID]) {
                        grouped[permission.sessionID] = [];
                    }
                    grouped[permission.sessionID].push(permission);
                }

                set({
                    permissions: grouped,
                    isLoading: false,
                    dismissed: false,
                });
            },

            replyPermission: async (requestID: string, reply: "once" | "always" | "reject", directory: string) => {
                set({ error: null });

                const result = await oc.permission.reply({
                    requestID,
                    reply,
                    directory
                });

                if (result.error) {
                    set({ error: getErrorMessage(result.error as SdkError) });
                    return;
                }

                const { permissions } = get();
                const newPermissions = { ...permissions };

                for (const sessionId of Object.keys(newPermissions)) {
                    newPermissions[sessionId] = newPermissions[sessionId].filter(
                        (p) => p.id !== requestID
                    );
                    if (newPermissions[sessionId].length === 0) {
                        delete newPermissions[sessionId];
                    }
                }

                set({ permissions: newPermissions });
            },

            dismissNotification: () => {
                set({ dismissed: true });
            },

            restoreNotification: () => {
                set({ dismissed: false });
            },

            clearPermissionsForSession: (sessionId: string) => {
                set((state) => {
                    const newPermissions = { ...state.permissions };
                    delete newPermissions[sessionId];
                    return { permissions: newPermissions };
                });
            },

            removePermission: (sessionId: string, requestId: string) => {
                set((state) => {
                    const newPermissions = { ...state.permissions };
                    if (newPermissions[sessionId]) {
                        newPermissions[sessionId] = newPermissions[sessionId].filter(
                            (p) => p.id !== requestId
                        );
                        if (newPermissions[sessionId].length === 0) {
                            delete newPermissions[sessionId];
                        }
                    }
                    return { permissions: newPermissions };
                });
            },

            addPermission: (permission: PermissionRequest) => {
                set((state) => {
                    const newPermissions = { ...state.permissions };
                    if (!newPermissions[permission.sessionID]) {
                        newPermissions[permission.sessionID] = [];
                    }
                    const exists = newPermissions[permission.sessionID].some(
                        (p) => p.id === permission.id
                    );
                    if (!exists) {
                        newPermissions[permission.sessionID].push(permission);
                    }
                    return { permissions: newPermissions, dismissed: false };
                });
            },
        }),
        {
            name: 'permission-storage',
            partialize: (state) => ({
                dismissed: state.dismissed,
            }),
        }
    )
)