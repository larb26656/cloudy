import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelConfig } from "@/types";

type SessionAgentModel = {
  agent?: string;
  model?: ModelConfig;
};

type SessionAgentModelStore = {
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
            const session = state.sessions[sessionId];
            if (!session) return state;
            const { agent: _, ...restSession } = session;
            if (!Object.keys(restSession).length) {
              const { [sessionId]: __, ...restSessions } = state.sessions;
              return { sessions: restSessions };
            }
            return {
              sessions: { ...state.sessions, [sessionId]: restSession },
            };
          }),

        clearSessionModel: (sessionId) =>
          set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;
            const { model: _, ...restSession } = session;
            if (!Object.keys(restSession).length) {
              const { [sessionId]: __, ...restSessions } = state.sessions;
              return { sessions: restSessions };
            }
            return {
              sessions: { ...state.sessions, [sessionId]: restSession },
            };
          }),
      }),
      {
        name: "session-agent-model",
        version: 1,
        migrate: (persistedState) => persistedState,
      },
    ),
  );
