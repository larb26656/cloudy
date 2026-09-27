import { create } from "zustand";
import type { SessionErrorInfo } from "@/types";

interface SessionErrorStore {
  errors: Map<string, SessionErrorInfo>;
  setError: (
    sessionId: string,
    error: SessionErrorInfo,
    providerId?: string,
  ) => void;
  clearError: (sessionId: string, providerId?: string) => void;
}

export const useSessionErrorStore = create<SessionErrorStore>((set) => ({
  errors: new Map(),
  setError: (sessionId, error, providerId = "opencode") =>
    set((state) => {
      const key =
        providerId === "opencode" ? sessionId : `${providerId}:${sessionId}`;
      if (state.errors.get(key) === error) return state;
      const next = new Map(state.errors);
      next.set(key, error);
      return { errors: next };
    }),
  clearError: (sessionId, providerId = "opencode") =>
    set((state) => {
      const key =
        providerId === "opencode" ? sessionId : `${providerId}:${sessionId}`;
      if (!state.errors.has(key)) return state;
      const next = new Map(state.errors);
      next.delete(key);
      return { errors: next };
    }),
}));
