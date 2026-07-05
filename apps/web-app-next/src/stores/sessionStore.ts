import { create } from "zustand";

type SessionStore = {
  selectedSessionId: string | null;
  selectSession: (sessionId: string) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionStore>((set) => ({
  selectedSessionId: null,
  selectSession: (sessionId) => set({ selectedSessionId: sessionId }),
  clearSession: () => set({ selectedSessionId: null }),
}));
