import { getErrorMessage, type SdkError } from "@/lib/opencode";
import type { OpencodeClient } from "@opencode-ai/sdk/v2";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DirectoryStoreState = {
    directories: string[];
    selectedDirectory: string | null;
    recentDirectories: string[];
    isLoading: boolean;
    error: string | null;
}

export type DirectoryStoreActions = {
    setSelectedDirectory: (directory: string | null) => void;
    addRecentDirectory: (directory: string) => void;
    searchDirectories: (query: string) => Promise<string[]>;
}

export type DirectoryStore = DirectoryStoreState & DirectoryStoreActions

export const createDirectoryStore = (oc: OpencodeClient) => create<DirectoryStore>()(
    persist(
        (set) => ({
            directories: [],
            selectedDirectory: null,
            recentDirectories: [],
            isLoading: false,
            error: null,

            setSelectedDirectory: (directory) => {
                set({ selectedDirectory: directory });
            },

            addRecentDirectory: (directory) => set((state) => {
                const updated = [directory, ...state.recentDirectories.filter((d: string) => d !== directory)].slice(0, 5);
                return { recentDirectories: updated };
            }),

            searchDirectories: async (query: string) => {
                set({ isLoading: true, error: null });

                const result = await oc.find.files({
                    query,
                    type: 'directory',
                    limit: 10,
                });

                if (result.error) {
                    set({ error: getErrorMessage(result.error as SdkError), isLoading: false });
                    return [];
                }
                const data = result.data ?? [];
                set({ isLoading: false, directories: data });
                return data;
            },
        }),
        {
            name: 'directory-storage',
            partialize: (state) => ({
                selectedDirectory: state.selectedDirectory,
                recentDirectories: state.recentDirectories,
            }),
        }
    )
)


