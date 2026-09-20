import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { extensionStorage } from "../lib/storage";

interface SessionStore {
  sessionId: string | null;
  isHydrating: boolean;
  selectSession: (sessionId: string) => Promise<void>;
  clearSession: () => Promise<void>;
  setHydrated: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      sessionId: null,
      isHydrating: true,

      selectSession: async (sessionId) => {
        set({ sessionId });
      },

      clearSession: async () => {
        set({ sessionId: null });
      },

      setHydrated: () => {
        set({ isHydrating: false });
      },
    }),
    {
      name: "latest-session-id",
      storage: createJSONStorage(() => extensionStorage),
      partialize: (state) => ({ sessionId: state.sessionId }),
      version: 1,
      migrate: (persistedState) => persistedState,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
