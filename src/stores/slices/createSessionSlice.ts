import { oc } from '@/lib/opencode';
import type { Session, SessionStatus } from '@opencode-ai/sdk/v2';

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

export interface SessionSlice {
  sessions: Session[];
  currentSessionId: string | null;
  sessionStatuses: Record<string, SessionStatus>;
  isLoading: boolean;
  error: string | null;

  loadSessions: () => Promise<void>;
  createSession: (title?: string) => Promise<Session | null>;
  selectSession: (sessionId: string) => void;
  updateSession: (sessionId: string, title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  forkSession: (sessionId: string, messageId: string) => Promise<Session | null>;
  updateSessionStatus: (sessionId: string, status: SessionStatus) => void;
  updateSessionFromEvent: (session: Session) => void;
  addSession: (session: Session) => void;
  removeSession: (sessionId: string) => void;
}

export const createSessionSlice = (set: any, get: any): SessionSlice => ({
  sessions: [],
  currentSessionId: null,
  sessionStatuses: {},
  isLoading: false,
  error: null,

  loadSessions: async () => {
    const directory = get().selectedDirectory;
    if (!directory) return;

    set({ isLoading: true, error: null });

    const result = await oc.session.list({ directory });

    if (result.error) {
      set({ error: getErrorMessage(result.error as SdkError), isLoading: false });
      return;
    }
    const data = result.data ?? [];
    set({ isLoading: false, sessions: data });
  },

  createSession: async (title?: string) => {
    const directory = get().selectedDirectory;
    if (!directory) return null;

    set({ error: null });
    const result = await oc.session.create({
      title: title || 'New Chat',
      directory,
    });
    if (result.error) {
      set({ error: getErrorMessage(result.error as SdkError) });
      return null;
    }
    const session = result.data;
    if (session) {
      set((state: any) => ({
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
      sessionID: sessionId,
      title
    });
    if (result.error) {
      set({ error: getErrorMessage(result.error as SdkError) });
      return;
    }
    const updated = result.data;
    if (updated) {
      set((state: any) => ({
        sessions: state.sessions.map((s: Session) => (s.id === sessionId ? { ...s, ...updated } : s)),
      }));
    }
  },

  deleteSession: async (sessionId: string) => {
    set({ error: null });
    const result = await oc.session.delete({ sessionID: sessionId });
    if (result.error) {
      set({ error: getErrorMessage(result.error as SdkError) });
      return;
    }
    set((state: any) => {
      const newSessions = state.sessions.filter((s: Session) => s.id !== sessionId);
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
      sessionID: sessionId,
      messageID: messageId
    });
    if (result.error) {
      set({ error: getErrorMessage(result.error as SdkError) });
      return null;
    }
    const session = result.data;
    if (session) {
      set((state: any) => ({
        sessions: [session, ...state.sessions],
        currentSessionId: session.id,
      }));
    }
    return null;
  },

  updateSessionStatus: (sessionId: string, status: SessionStatus) => {
    set((state: any) => ({
      sessionStatuses: { ...state.sessionStatuses, [sessionId]: status },
    }));
  },

  updateSessionFromEvent: (session: Session) => {
    set((state: any) => ({
      sessions: state.sessions.map((s: Session) => (s.id === session.id ? { ...s, ...session } : s)),
    }));
  },

  addSession: (session: Session) => {
    set((state: any) => ({
      sessions: [session, ...state.sessions],
    }));
  },

  removeSession: (sessionId: string) => {
    set((state: any) => ({
      sessions: state.sessions.filter((s: Session) => s.id !== sessionId),
    }));
  },
});
