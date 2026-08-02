import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelConfig } from "@/types";

type SessionAgentModel = {
  agent: string | null;
  model: ModelConfig | null;
};

type SessionAgentModelStore = {
  // keyed by sessionId
  sessions: Record<string, SessionAgentModel>;
  setSessionAgent: (sessionId: string, agent: string | null) => void;
  setSessionModel: (sessionId: string, model: ModelConfig | null) => void;
  getSessionAgent: (sessionId: string) => string | null;
  getSessionModel: (sessionId: string) => ModelConfig | null;
  clearSessionAgent: (sessionId: string) => void;
  clearSessionModel: (sessionId: string) => void;
};

export const useSessionAgentModelStore =
  create<SessionAgentModelStore>()(
    persist(
      (set, get) => ({
        sessions: {},

        setSessionAgent: (sessionId, agent) =>
          set((state) => ({
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...state.sessions[sessionId],
                agent,
              },
            },
          })),

        setSessionModel: (sessionId, model) =>
          set((state) => ({
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...state.sessions[sessionId],
                model,
              },
            },
          })),

        getSessionAgent: (sessionId) =>
          get().sessions[sessionId]?.agent ?? null,

        getSessionModel: (sessionId) =>
          get().sessions[sessionId]?.model ?? null,

        clearSessionAgent: (sessionId) =>
          set((state) => {
            if (!state.sessions[sessionId]) return state;
            const { [sessionId]: _, ...rest } = state.sessions;
            return { sessions: rest };
          }),

        clearSessionModel: (sessionId) =>
          set((state) => {
            if (!state.sessions[sessionId]) return state;
            const { [sessionId]: _, ...rest } = state.sessions;
            return { sessions: rest };
          }),
      }),
      { name: "session-agent-model", version: 1 },
    ),
  );
