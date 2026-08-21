import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_ENTRIES = 8;

type RecentDirectoryStore = {
  paths: string[];
  push: (path: string) => void;
  remove: (path: string) => void;
};

export const useRecentDirectoryStore = create<RecentDirectoryStore>()(
  persist(
    (set) => ({
      paths: [],
      push: (path) => {
        const trimmed = path.trim();
        if (!trimmed) return;
        set((state) => ({
          paths: [trimmed, ...state.paths.filter((p) => p !== trimmed)].slice(
            0,
            MAX_ENTRIES,
          ),
        }));
      },
      remove: (path) =>
        set((state) => ({ paths: state.paths.filter((p) => p !== path) })),
    }),
    {
      name: "recent-directories",
      version: 1,
      migrate: (state) => state,
    },
  ),
);

export { MAX_ENTRIES };
