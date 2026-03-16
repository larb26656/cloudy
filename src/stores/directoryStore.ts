import { getErrorMessage, oc, type SdkError } from "@/lib/opencode";
import { create } from "zustand";

type DirectoryStoreState = {
    directories: string[];
    selectedDirectory: string | null;
    recentDirectories: string[];
    isLoading: boolean;
    error: string | null;
}

type DirectoryStoreActions = {
    setSelectedDirectory: (directory: string | null) => void;
    addRecentDirectory: (directory: string) => void;
    searchDirectories: (query: string) => Promise<void>;
}

type DirectoryStore = DirectoryStoreState & DirectoryStoreActions

export const useDirectoryStore = create<DirectoryStore>()((set) => ({
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
            return;
        }
        const data = result.data;
        set({ isLoading: false, directories: data });
    },
}))


