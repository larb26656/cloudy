import { create } from "zustand";
import type { AssistantMessage } from "@opencode-ai/sdk/v2";

export type SessionErrorInfo = NonNullable<AssistantMessage["error"]>;

interface SessionErrorStore {
  errors: Map<string, SessionErrorInfo>;
  setError: (sessionId: string, error: SessionErrorInfo) => void;
  clearError: (sessionId: string) => void;
}

export const useSessionErrorStore = create<SessionErrorStore>((set) => ({
  errors: new Map(),
  setError: (sessionId, error) =>
    set((state) => {
      if (state.errors.get(sessionId) === error) return state;
      const next = new Map(state.errors);
      next.set(sessionId, error);
      return { errors: next };
    }),
  clearError: (sessionId) =>
    set((state) => {
      if (!state.errors.has(sessionId)) return state;
      const next = new Map(state.errors);
      next.delete(sessionId);
      return { errors: next };
    }),
}));
