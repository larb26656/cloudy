import { create } from 'zustand';
import { oc } from '@/lib/opencode';
import type { Session, SessionStatus } from '@opencode-ai/sdk';

type SdkError = {
  message?: string;
  data?: unknown;
  errors?: Array<{ message?: string }>;
  name?: string;
};

function getErrorMessage(error: SdkError): string {
  if (error.message) return error.message;
  if (error.errors && error.errors.length > 0 && error.errors[0].message) {
    return error.errors[0].message;
  }
  if (error.data && typeof error.data === 'object' && 'message' in error.data) {
    return String((error.data as { message: string }).message);
  }
  return 'Unknown error';
}

interface SessionState {
  sessions: Session[];
  currentSessionId: string | null;
  sessionStatuses: Record<string, SessionStatus>;
  isLoading: boolean;
  error: string | null;
  currentDirectory: string | null;

  loadSessions: (directory?: string | null) => Promise<void>;
  createSession: (title?: string, directory?: string) => Promise<Session | null>;
  selectSession: (sessionId: string) => void;
  updateSession: (sessionId: string, title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  forkSession: (sessionId: string, messageId: string) => Promise<Session | null>;
  updateSessionStatus: (sessionId: string, status: SessionStatus) => void;
  updateSessionFromEvent: (session: Session) => void;
  addSession: (session: Session) => void;
  removeSession: (sessionId: string) => void;
  setCurrentDirectory: (directory: string | null) => void;
}

export const useSessionStoreV2 = create<SessionState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  sessionStatuses: {},
  isLoading: false,
  error: null,
  currentDirectory: null,

  loadSessions: async (directory?: string | null) => {
    set({ isLoading: true, error: null });
    if (directory) {
      set({ currentDirectory: directory });
    }
    const result = await oc.session.list({
      query: { directory: directory ?? get().currentDirectory ?? undefined },
    });
    if (result.error) {
      set({ error: getErrorMessage(result.error as SdkError), isLoading: false });
      return;
    }
    const data = result.data ?? [];
    set({ sessions: data, isLoading: false });
    if (data.length > 0 && !get().currentSessionId) {
      set({ currentSessionId: data[0].id });
    }
  },

  createSession: async (title?: string, directory?: string) => {
    set({ error: null });
    const result = await oc.session.create({
      body: { title: title || 'New Chat' },
      query: { directory: directory ?? get().currentDirectory ?? undefined },
    });
    if (result.error) {
      set({ error: getErrorMessage(result.error as SdkError) });
      return null;
    }
    const session = result.data;
    if (session) {
      set((state) => ({
        sessions: [session, ...state.sessions],
        currentSessionId: session.id,
      }));
    }
    return session ?? null;
  },

  selectSession: (sessionId: string) => {
    set({ currentSessionId: sessionId });
  },

  updateSession: async (sessionId: string, title: string) => {
    set({ error: null });
    const result = await oc.session.update({
      path: { id: sessionId },
      body: { title },
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
    const result = await oc.session.delete({ path: { id: sessionId } });
    if (result.error) {
      set({ error: getErrorMessage(result.error as SdkError) });
      return;
    }
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== sessionId);
      const newCurrentId =
        state.currentSessionId === sessionId
          ? newSessions[0]?.id || null
          : state.currentSessionId;
      return { sessions: newSessions, currentSessionId: newCurrentId };
    });
  },

  forkSession: async (sessionId: string, messageId: string) => {
    set({ error: null });
    const result = await oc.session.fork({
      path: { id: sessionId },
      body: { messageID: messageId },
    });
    if (result.error) {
      set({ error: getErrorMessage(result.error as SdkError) });
      return null;
    }
    const session = result.data;
    if (session) {
      set((state) => ({
        sessions: [session, ...state.sessions],
        currentSessionId: session.id,
      }));
    }
    return session ?? null;
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

  setCurrentDirectory: (directory: string | null) => {
    set({ currentDirectory: directory });
  },
}));
