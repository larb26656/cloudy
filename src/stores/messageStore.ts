import { getErrorMessage, oc, type SdkError } from "@/lib/opencode";
import type { ModelConfig } from "@/types";
import type { Message, Part, SessionMessagesResponse } from "@opencode-ai/sdk/v2";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useModelStore } from "./modelStore";

type MessageStoreState = {
    messages: Record<string, SessionMessagesResponse>;
    streamingMessageIds: Record<string, string | null>;
    isLoading: boolean;
    error: string | null;
    isThinking: boolean;
    thinkingContent: Record<string, string>;
    thinkingState: Record<string, 'active' | 'complete' | null>;
}

type MessageStoreSessionActions = {
    loadMessages: (sessionId: string) => Promise<void>;
    sendMessage: (directory: string, sessionId: string, text: string, model?: ModelConfig | null, agent?: string | null) => Promise<void>;
    abortGeneration: (directory: string, sessionId: string) => Promise<void>;
    appendStreamChunk: (sessionId: string, messageId: string, delta: string) => void;
    updateMessage: (message: Message) => void;
    updateMessagePart: (part: Part) => void;
    clearMessages: (sessionId: string) => void;
}

type MessageStore = MessageStoreState & MessageStoreSessionActions

export const useMessageStore = create<MessageStore>()(
    (set) => ({
        messages: {},
        streamingMessageIds: {},
        isLoading: false,
        error: null,
        isThinking: false,
        thinkingContent: {},
        thinkingState: {},

        clearMessages: (sessionId: string) => {
            set((state) => ({
                messages: {
                    ...state.messages,
                    [sessionId]: [],
                },
            }));
        },

        loadMessages: async (sessionId: string) => {
            set({ isLoading: true, error: null });
            const result = await oc.session.messages({
                sessionID: sessionId,
            });

            if (result.error) {
                set({ error: getErrorMessage(result.error as SdkError), isLoading: false });
                return;
            }
            const data = result.data;

            set((state) => ({
                messages: { ...state.messages, [sessionId]: data },
                isLoading: false,
            }));
        },

        sendMessage: async (directory: string, sessionId: string, text: string, model?: ModelConfig | null, agent?: string | null) => {
            set({ error: null, isThinking: true });

            const selectedModel = useModelStore.getState().selectedModel;

            await oc.session.promptAsync({
                sessionID: sessionId,
                parts: [{ type: 'text', text }],
                model: model ?? selectedModel ?? undefined,
                agent: agent ?? undefined,
            }, {
                headers: { 'x-opencode-directory': directory }
            });

            set({ isThinking: false });
        },

        abortGeneration: async (directory: string, sessionId: string) => {
            set({ error: null });
            const result = await oc.session.abort({ sessionID: sessionId }, {
                headers: { 'x-opencode-directory': directory }
            });
            if (result.error) {
                set({ error: getErrorMessage(result.error as SdkError) });
                return;
            }
            set((state) => ({
                streamingMessageIds: { ...state.streamingMessageIds, [sessionId]: null },
            }));
        },

        appendStreamChunk: (sessionId: string, messageId: string, delta: string) => {
            set((state) => {
                const sessionMessages = state.messages[sessionId] || [];
                const messageIndex = sessionMessages.findIndex(
                    (m: any) => m.info.id === messageId
                );

                if (messageIndex === -1) {
                    return {};
                }

                const updatedMessages = sessionMessages.map((msg: any) => {
                    if (msg.info.id !== messageId) return msg;

                    return {
                        ...msg,
                        parts: msg.parts.map((p: any) =>
                            p.type === "text"
                                ? { ...p, text: p.text + delta }
                                : p
                        ),
                    };
                });

                return {
                    messages: {
                        ...state.messages,
                        [sessionId]: updatedMessages,
                    },
                };
            });
        },

        updateMessage: (info: Message) => {
            set((state) => {
                const sessionMessages = state.messages[info.sessionID] || [];
                const message = sessionMessages.findIndex((m: any) => m.info.id === info.id);

                if (message !== -1) {
                    return {};
                }

                return {
                    messages: {
                        ...state.messages,
                        [info.sessionID]: [...sessionMessages, {
                            info,
                            parts: []
                        }]
                    }
                };
            });
        },

        updateMessagePart: (info: Part) => {
            set((state) => {
                const sessionMessages = state.messages[info.sessionID] || [];

                const updatedMessages = sessionMessages.map((sessionMessage: any) => {
                    if (sessionMessage.info.id !== info.messageID) {
                        return sessionMessage;
                    }

                    const partIndex = sessionMessage.parts.findIndex(
                        (p: any) => p.id === info.id
                    );

                    if (partIndex !== -1) {
                        const newParts = [...sessionMessage.parts];
                        newParts[partIndex] = info;

                        return {
                            ...sessionMessage,
                            parts: newParts
                        };
                    }

                    return {
                        ...sessionMessage,
                        parts: [...sessionMessage.parts, info]
                    };
                });

                return {
                    messages: {
                        ...state.messages,
                        [info.sessionID]: updatedMessages
                    }
                };
            });
        },
    }),
)


