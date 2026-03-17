import { getErrorMessage, oc, type SdkError } from "@/lib/opencode";
import type { QuestionRequest, Session, SessionStatus } from "@opencode-ai/sdk/v2";
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
    createSession: (directory: string, title?: string) => Promise<Session | null>;
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
}

type SessionStore = SessionStoreState & SessionsStoreSessionActions

export const useSessionStore = create<SessionStore>()(
    persist(
        (set) => ({
            sessions: [],
            selectedSessionId: null,
            sessionStatuses: {},
            isLoading: false,
            error: null,
            activeQuestion: null,
            loadSessions: async (directory: string) => {
                set({ isLoading: true, error: null });

                const result = await oc.session.list({ directory, limit: 20 });

                if (result.error) {
                    set({ error: getErrorMessage(result.error as SdkError), isLoading: false });
                    return;
                }
                const data = result.data;
                set({ isLoading: false, sessions: data });
            },

            createSession: async (directory: string, title?: string) => {
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

                return session;
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
                    return { sessions: newSessions, selectedSessionId: newCurrentId };
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
                        selectedSessionId: session.id,
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

            setActiveQuestion: (question: QuestionRequest | null) => {
                set({ activeQuestion: question });
            },

            clearActiveQuestion: () => {
                set({ activeQuestion: null });
            },
        }),
        {
            name: 'session-storage',
            partialize: (state) => ({
                selectedSessionId: state.selectedSessionId,
            }),
        }
    )
)


