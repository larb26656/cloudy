// stores/sessionStore.ts
import { create } from 'zustand';
import { sessionsApi } from '../api';
import type { Session, SessionStatus } from '../types';

interface SessionState {
  sessions: Session[];
  currentSessionId: string | null;
  sessionStatuses: Record<string, SessionStatus>;
  isLoading: boolean;
  error: string | null;
  currentDirectory: string | null;

  // Actions
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

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  sessionStatuses: {},
  isLoading: false,
  error: null,
  currentDirectory: null,

  loadSessions: async (directory?: string | null) => {
    set({ isLoading: true, error: null });
    try {
      const params: { roots: boolean; limit: number; directory?: string } = { 
        roots: true, 
        limit: 50 
      };
      
      if (directory) {
        params.directory = directory;
      }
      
      const sessions = await sessionsApi.list(params);
      set({ sessions, isLoading: false });
      
      // Load initial session if none selected
      if (sessions.length > 0 && !get().currentSessionId) {
        set({ currentSessionId: sessions[0].id });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createSession: async (title?: string, directory?: string) => {
    try {
      const session = await sessionsApi.create({ 
        title: title || 'New Chat'
      }, directory);
      set((state) => ({
        sessions: [session, ...state.sessions],
        currentSessionId: session.id,
      }));
      return session;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  selectSession: (sessionId: string) => {
    set({ currentSessionId: sessionId });
  },

  updateSession: async (sessionId: string, title: string) => {
    try {
      const updated = await sessionsApi.update(sessionId, { title });
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, ...updated } : s
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      await sessionsApi.delete(sessionId);
      set((state) => {
        const newSessions = state.sessions.filter((s) => s.id !== sessionId);
        const newCurrentId =
          state.currentSessionId === sessionId
            ? newSessions[0]?.id || null
            : state.currentSessionId;
        return {
          sessions: newSessions,
          currentSessionId: newCurrentId,
        };
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  forkSession: async (sessionId: string, messageId: string) => {
    try {
      const session = await sessionsApi.fork(sessionId, { messageID: messageId });
      set((state) => ({
        sessions: [session, ...state.sessions],
        currentSessionId: session.id,
      }));
      return session;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  updateSessionStatus: (sessionId: string, status: SessionStatus) => {
    set((state) => ({
      sessionStatuses: { ...state.sessionStatuses, [sessionId]: status },
    }));
  },

  updateSessionFromEvent: (session: Session) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === session.id ? { ...s, ...session } : s
      ),
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
