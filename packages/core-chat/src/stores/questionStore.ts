import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getErrorMessage, getOc, type SdkError } from "../lib";
import type { QuestionRequest } from "@opencode-ai/sdk/v2";

type QuestionStoreState = {
    questions: Record<string, QuestionRequest[]>;
    isLoading: boolean;
    error: string | null;
    dismissed: boolean;
}

type QuestionStoreActions = {
    loadQuestions: (directory: string) => Promise<void>;
    replyQuestion: (requestID: string, answers: string[][], directory: string) => Promise<void>;
    rejectQuestion: (requestID: string, directory: string) => Promise<void>;
    dismissNotification: () => void;
    restoreNotification: () => void;
    clearQuestionsForSession: (sessionId: string) => void;
    removeQuestion: (sessionId: string, requestId: string) => void;
    addQuestion: (question: QuestionRequest) => void;
}

export type QuestionStore = QuestionStoreState & QuestionStoreActions;

export const useQuestionStore = create<QuestionStore>()(
    persist(
        (set, get) => ({
            questions: {},
            isLoading: false,
            error: null,
            dismissed: false,

            loadQuestions: async (directory: string) => {
                set({ isLoading: true, error: null });
                const oc = getOc();

                const result = await oc.question.list({ directory });

                if (result.error) {
                    set({ error: getErrorMessage(result.error as SdkError), isLoading: false });
                    return;
                }

                const questionList = result.data || [];
                const grouped: Record<string, QuestionRequest[]> = {};

                for (const question of questionList) {
                    if (!grouped[question.sessionID]) {
                        grouped[question.sessionID] = [];
                    }
                    grouped[question.sessionID]!.push(question);
                }

                set({
                    questions: grouped,
                    isLoading: false,
                    dismissed: false,
                });
            },

            replyQuestion: async (requestID: string, answers: string[][], directory: string) => {
                set({ error: null });
                const oc = getOc();

                const result = await oc.question.reply({
                    requestID,
                    answers,
                    directory
                });

                if (result.error) {
                    set({ error: getErrorMessage(result.error as SdkError) });
                    return;
                }

                const { questions } = get();
                const newQuestions = { ...questions };

                for (const sessionId of Object.keys(newQuestions)) {
                    const sessionQuestions = newQuestions[sessionId];
                    if (!sessionQuestions) continue;
                    const filtered = sessionQuestions.filter((q) => q.id !== requestID);
                    if (filtered.length === 0) {
                        delete newQuestions[sessionId];
                    } else {
                        newQuestions[sessionId] = filtered;
                    }
                }

                set({ questions: newQuestions });
            },

            rejectQuestion: async (requestID: string, directory: string) => {
                set({ error: null });
                const oc = getOc();

                const result = await oc.question.reject({ requestID, directory });

                if (result.error) {
                    set({ error: getErrorMessage(result.error as SdkError) });
                    return;
                }

                const { questions } = get();
                const newQuestions = { ...questions };

                for (const sessionId of Object.keys(newQuestions)) {
                    const sessionQuestions = newQuestions[sessionId];
                    if (!sessionQuestions) continue;
                    const filtered = sessionQuestions.filter((q) => q.id !== requestID);
                    if (filtered.length === 0) {
                        delete newQuestions[sessionId];
                    } else {
                        newQuestions[sessionId] = filtered;
                    }
                }

                set({ questions: newQuestions });
            },

            dismissNotification: () => {
                set({ dismissed: true });
            },

            restoreNotification: () => {
                set({ dismissed: false });
            },

            clearQuestionsForSession: (sessionId: string) => {
                set((state) => {
                    const newQuestions = { ...state.questions };
                    delete newQuestions[sessionId];
                    return { questions: newQuestions };
                });
            },

            removeQuestion: (sessionId: string, requestId: string) => {
                set((state) => {
                    const newQuestions = { ...state.questions };
                    const sessionQuestions = newQuestions[sessionId];
                    if (sessionQuestions) {
                        const filtered = sessionQuestions.filter((q) => q.id !== requestId);
                        if (filtered.length === 0) {
                            delete newQuestions[sessionId];
                        } else {
                            newQuestions[sessionId] = filtered;
                        }
                    }
                    return { questions: newQuestions };
                });
            },

            addQuestion: (question: QuestionRequest) => {
                set((state) => {
                    const newQuestions = { ...state.questions };
                    if (!newQuestions[question.sessionID]) {
                        newQuestions[question.sessionID] = [];
                    }
                    const sessionQuestions = newQuestions[question.sessionID]!;
                    const exists = sessionQuestions.some((q) => q.id === question.id);
                    if (!exists) {
                        sessionQuestions.push(question);
                    }
                    return { questions: newQuestions, dismissed: false };
                });
            },
        }),
        {
            name: 'question-storage',
            partialize: (state) => ({
                dismissed: state.dismissed,
            }),
        }
    )
);
