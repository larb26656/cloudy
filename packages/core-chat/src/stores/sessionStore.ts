import { create } from "zustand";
import type { Session, SessionStatus } from "@opencode-ai/sdk/v2";
import type { QuestionRequest } from "@opencode-ai/sdk/v2";
import { getErrorMessage, getOc, createDefaultTitle, type SdkError } from "../lib";

type SessionStoreState = {
  sessions: Session[];
  selectedSessionId: string | null;
  sessionStatuses: Record<string, SessionStatus>;
  isLoading: boolean;
  error: string | null;
  activeQuestion: QuestionRequest | null;
}

type SessionsStoreSessionActions = {
  loadSessions: (directory: string) => Promise<void>;
  createSession: (directory: string, title?: string) => Promise<Session>;
  createTempSession: () => void;
  setCreateSession: (session: Session) => void;
  selectSession: (sessionId: string) => void;
  updateSession: (sessionId: string, title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  forkSession: (sessionId: string, messageId: string) => Promise<Session | null>;
  updateSessionStatus: (sessionId: string, status: SessionStatus) => void;
  updateSessionFromEvent: (session: Session) => void;
  addSession: (session: Session) => void;
  removeSession: (sessionId: string) => void;
  setActiveQuestion: (question: QuestionRequest | null) => void;
  clearActiveQuestion: () => void;
};

export type SessionStore = SessionStoreState & SessionsStoreSessionActions;

export const useSessionStore = create<SessionStore>()(
  (set) => ({
    sessions: [],
    selectedSessionId: null,
    sessionStatuses: {},
    isLoading: false,
    error: null,
    activeQuestion: null,

    loadSessions: async (directory: string) => {
      set({ isLoading: true, error: null });
      const oc = getOc();

      const result = await oc.session.list({ directory, limit: 20 });

      if (result.error) {
        set({ error: getErrorMessage(result.error as SdkError), isLoading: false });
        return;
      }
      const data = result.data;
      set({ isLoading: false, sessions: data });
    },

    createSession: async (directory: string, title?: string) => {
      const oc = getOc();
      const result = await oc.session.create({
        title: title || createDefaultTitle(),
        directory,
      });

      if (result.error) {
        const message = getErrorMessage(result.error as SdkError);
        throw new Error(message);
      }

      const session = result.data;

      return session;
    },

    createTempSession: () => {
      set({
        selectedSessionId: null,
      });
    },

    setCreateSession: (session: Session) => {
      set((state) => ({
        sessions: [session, ...state.sessions],
        selectedSessionId: session.id,
      }));
    },

    selectSession: (sessionId: string) => {
      set({ selectedSessionId: sessionId });
    },

    updateSession: async (sessionId: string, title: string) => {
      set({ error: null });
      const oc = getOc();
      const result = await oc.session.update({
        sessionID: sessionId,
        title
      });
      if (result.error) {
        set({ error: getErrorMessage(result.error as SdkError) });
        return;
      }
      const updated = result.data;
      if (updated) {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, ...updated } : s)),
        }));
      }
    },

    deleteSession: async (sessionId: string) => {
      set({ error: null });
      const oc = getOc();
      const result = await oc.session.delete({ sessionID: sessionId });
      if (result.error) {
        set({ error: getErrorMessage(result.error as SdkError) });
        return;
      }
      set((state) => {
        const newSessions = state.sessions.filter((s) => s.id !== sessionId);
        const newCurrentId =
          state.selectedSessionId === sessionId
            ? newSessions[0]?.id || null
            : state.selectedSessionId;
        return { sessions: newSessions, selectedSessionId: newCurrentId };
      });
    },

    forkSession: async (sessionId: string, messageId: string) => {
      set({ error: null });
      const oc = getOc();
      const result = await oc.session.fork({
        sessionID: sessionId,
        messageID: messageId
      });
      if (result.error) {
        set({ error: getErrorMessage(result.error as SdkError) });
        return null;
      }
      const session = result.data;
      if (session) {
        set((state) => ({
          sessions: [session, ...state.sessions],
          selectedSessionId: session.id,
        }));
      }
      return null;
    },

    updateSessionStatus: (sessionId: string, status: SessionStatus) => {
      set((state) => ({
        sessionStatuses: { ...state.sessionStatuses, [sessionId]: status },
      }));
    },

    updateSessionFromEvent: (session: Session) => {
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === session.id ? { ...s, ...session } : s)),
      }));
    },

    addSession: (session: Session) => {
      set((state) => ({
        sessions: [session, ...state.sessions],
      }));
    },

    removeSession: (sessionId: string) => {
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
      }));
    },

    setActiveQuestion: (question: QuestionRequest | null) => {
      set((state) => {
        if (question && state.activeQuestion && state.activeQuestion.id === question.id) {
          return state;
        }
        return { activeQuestion: question };
      });
    },

    clearActiveQuestion: () => {
      set({ activeQuestion: null });
    },
  }),
);
