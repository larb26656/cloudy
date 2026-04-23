import { createDefaultTitle, getErrorMessage, type SdkError, type OCClient } from "@/lib/opencode";
import type { QuestionRequest, Session, SessionStatus } from "@opencode-ai/sdk/v2";
import { create } from "zustand";

const PAGE_SIZE = 20;

export type SessionStoreState = {
    sessions: Session[];
    selectedSessionId: string | null;
    sessionStatuses: Record<string, SessionStatus>;
    isLoading: boolean;
    isLoadingMore: boolean;
    nextCursor: number | undefined;
    error: string | null;
    activeQuestion: QuestionRequest | null;
}

export type SessionsStoreSessionActions = {
    loadSessions: (directory: string) => Promise<void>;
    loadMoreSessions: (directory: string) => Promise<void>;
    createSession: (directory: string, title?: string) => Promise<Session>;
    createTempSession: () => void,
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

export type SessionStore = SessionStoreState & SessionsStoreSessionActions

function getNextCursor(sessions: Session[]): number | undefined {
    if (sessions.length === 0) {
        return undefined;
    }

    const last = sessions[sessions.length - 1];

    return last.time.created;
}

export const createSessionStore = (oc: OCClient) => create<SessionStore>()(
    (set, get) => ({
        sessions: [],
        selectedSessionId: null,
        sessionStatuses: {},
        isLoading: false,
        isLoadingMore: false,
        nextCursor: undefined,
        error: null,
        activeQuestion: null,
        loadSessions: async (directory: string) => {
            set({ isLoading: true, error: null, nextCursor: undefined });

            const result = await oc.experimental.session.list({ directory, limit: PAGE_SIZE, roots: true, cursor: get().nextCursor });

            if (result.error) {
                set({ error: getErrorMessage(result.error as SdkError), isLoading: false });
                return;
            }
            const data = result.data ?? [];
            const nextCursor = getNextCursor(data);

            set({ isLoading: false, sessions: data, nextCursor });
        },

        loadMoreSessions: async (directory: string) => {
            set({ isLoadingMore: true, error: null });

            const result = await oc.experimental.session.list({ directory, limit: PAGE_SIZE, roots: true, cursor: get().nextCursor });

            if (result.error) {
                set({ error: getErrorMessage(result.error as SdkError), isLoadingMore: false });
                return;
            }
            const data = result.data ?? [];
            const nextCursor = getNextCursor(data);

            set((prev) => ({
                isLoadingMore: false,
                sessions: [...prev.sessions, ...data],
                nextCursor,
            }));
        },

        createSession: async (directory: string, title?: string) => {
            console.log("create session");
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
            console.log("create session temp");
            set({
                selectedSessionId: null,
            });
        },

        setCreateSession: (session: Session) => {
            // skip auto select for sub agent session
            if (!session.parentID) {
                set((state) => ({
                    sessions: [session, ...state.sessions],
                    selectedSessionId: session.id,
                }));

                return;
            }

            set((state) => ({
                sessions: [session, ...state.sessions],
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
)


