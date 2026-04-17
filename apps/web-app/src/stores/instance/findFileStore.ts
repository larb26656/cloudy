import { create } from "zustand";
import { getErrorMessage, type SdkError, type OCClient } from "@/lib/opencode";

export type FindType = "file" | "directory";

export type FindFileStoreState = {
  results: string[];
  isLoading: boolean;
  error: string | null;
}

export type FindFileStoreActions = {
  searchFiles: (
    directory: string,
    query: string,
    options?: { type?: FindType; limit?: number }
  ) => Promise<string[]>;
  clearResults: () => void;
}

export type FindFileStore = FindFileStoreState & FindFileStoreActions

export const createFindFileStore = (oc: OCClient) => create<FindFileStore>()(
  (set) => ({
    results: [],
    isLoading: false,
    error: null,

    searchFiles: async (directory, query, options) => {
      set({ isLoading: true, error: null });
      try {
        const result = await oc.find.files({
          directory,
          query,
          type: options?.type,
          limit: options?.limit ?? 10,
        });

        if (result.error) {
          throw new Error(getErrorMessage(result.error as SdkError));
        }

        const files = result.data ?? [];
        set({ results: files, isLoading: false });
        return files; // <-- return string[]
      } catch (err) {
        const message = (err as Error).message;
        set({ error: message, isLoading: false, results: [] });
        return []; // <-- return empty array on error
      }
    },


    clearResults: () => {
      set({ results: [], error: null });
    },
  })
);
