import { create } from "zustand";

type SessionStore = {
  selectedSessionId: string | null;
};

export const useSessionStore = create<SessionStore>(() => ({
  selectedSessionId: null,
}));
