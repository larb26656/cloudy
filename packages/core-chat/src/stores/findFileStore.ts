import { create } from "zustand";
import { getOc, getErrorMessage, type SdkError } from "../lib/client";

type FindType = "file" | "directory";

type FindFileStoreState = {
  results: string[];
  isLoading: boolean;
  error: string | null;
}

type FindFileStoreActions = {
  searchFiles: (
    directory: string,
    query: string,
    options?: { type?: FindType; limit?: number }
  ) => Promise<string[]>;
  clearResults: () => void;
}

export type FindFileStore = FindFileStoreState & FindFileStoreActions

export const useFindFileStore = create<FindFileStore>()(
  (set) => ({
    results: [],
    isLoading: false,
    error: null,

    searchFiles: async (directory, query, options) => {
      set({ isLoading: true, error: null });
      try {
        const oc = getOc();
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
        return files;
      } catch (err) {
        const message = (err as Error).message;
        set({ error: message, isLoading: false, results: [] });
        return [];
      }
    },


    clearResults: () => {
      set({ results: [], error: null });
    },
  })
);
