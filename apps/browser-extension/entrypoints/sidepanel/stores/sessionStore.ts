import { create } from "zustand";

const SESSION_STORAGE_KEY = "latest-session-id";

interface SessionStore {
  sessionId: string | null;
  isHydrating: boolean;
  hydrate: () => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  isHydrating: true,

  hydrate: async () => {
    const stored = await browser.storage.local.get(SESSION_STORAGE_KEY);
    const value = stored[SESSION_STORAGE_KEY];
    set({
      sessionId: typeof value === "string" ? value : null,
      isHydrating: false,
    });
  },

  selectSession: async (sessionId) => {
    await browser.storage.local.set({ [SESSION_STORAGE_KEY]: sessionId });
    set({ sessionId });
  },

  clearSession: async () => {
    await browser.storage.local.remove(SESSION_STORAGE_KEY);
    set({ sessionId: null });
  },
}));
