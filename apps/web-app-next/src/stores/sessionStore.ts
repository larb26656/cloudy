import { create } from "zustand";

/**
 * @deprecated Use `useActiveSession` from `@/stores/session.store` instead.
 */
type SessionStore = {
  selectedSessionId: string | null;
  selectSession: (sessionId: string) => void;
  clearSession: () => void;
};

/**
 * @deprecated Use `useActiveSession` from `@/stores/session.store` instead.
 */
export const useSessionStore = create<SessionStore>((set) => ({
  selectedSessionId: null,
  selectSession: (sessionId) => set({ selectedSessionId: sessionId }),
  clearSession: () => set({ selectedSessionId: null }),
}));
