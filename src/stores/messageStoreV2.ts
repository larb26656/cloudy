import { create } from 'zustand';
import { oc } from '@/lib/opencode';
import type { Message, TextPartInput, SessionMessagesResponse, SessionPromptResponse, Event, TextPart, Part } from '@opencode-ai/sdk/v2';
import type { AssistantSessionMessage, UserSessionMessage } from '@/types/messagev2';

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

interface MessageState {
  messages: Record<string, SessionMessagesResponse>;
  streamingMessageIds: Record<string, string | null>;
  isLoading: boolean;
  error: string | null;
  currentDirectory: string | null;

  loadMessages: (sessionId: string) => Promise<void>;
  sendMessage: (sessionId: string, text: string) => Promise<void>;
  abortGeneration: (sessionId: string) => Promise<void>;
  appendStreamChunk: (sessionId: string, messageId: string, delta: string) => void;
  updateMessage: (message: Message) => void;
  updateMessagePart: (part: Part) => void;
  setCurrentDirectory: (directory: string | null) => void;
  handleEvent: (event: Event) => void;
}

export const useMessageStoreV2 = create<MessageState>((set, get) => ({
  messages: {},
  streamingMessageIds: {},
  isLoading: false,
  error: null,
  currentDirectory: null,

  setCurrentDirectory: (directory: string | null) => {
    set({ currentDirectory: directory });
  },

  loadMessages: async (sessionId: string) => {
    console.log("invoke loadd");
    set({ isLoading: true, error: null });
    const result = await oc.session.messages({
      sessionID: sessionId,
      // query: { directory: get().currentDirectory ?? undefined },
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

  sendMessage: async (sessionId: string, text: string) => {
    set({ error: null });
    // const tempId = `temp_${Date.now()}`;

    // const userMessage: UserSessionMessage = {
    //   info: {
    //     id: tempId,
    //     sessionID: sessionId,
    //     role: 'user',
    //     time: { created: Date.now() },
    //     agent: '',
    //     model: {
    //       providerID: '',
    //       modelID: ''
    //     }
    //   },
    //   parts: [{ type: 'text', text } as TextPartInput],
    // };

    // set((state) => ({
    //   messages: {
    //     ...state.messages,
    //     [sessionId]: [...(state.messages[sessionId] || []), userMessage],
    //   },
    // }));

    const result = await oc.session.prompt({
      sessionID: sessionId,
      parts: [{ type: 'text', text }],
      // query: { directory: get().currentDirectory ?? undefined },
    });

    if (result.error) {
      // set((state) => ({
      //   messages: {
      //     ...state.messages,
      //     [sessionId]: state.messages[sessionId]?.filter((m) => m.info.id !== tempId) || [],
      //   },
      //   error: getErrorMessage(result.error as SdkError),
      // }));
      return;
    }
    // if (response?.info?.id) {
    //   set((state) => ({
    //     messages: {
    //       ...state.messages,
    //       [sessionId]: state.messages[sessionId]?.filter((m) => m.info.id !== tempId) || [],
    //     },
    //   }));
    //   // get().loadMessages(sessionId);
    // }
  },

  abortGeneration: async (sessionId: string) => {
    set({ error: null });
    const result = await oc.session.abort({ sessionID: sessionId });
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
        (m) => m.info.id === messageId
      );

      // skip message if not exist
      if (messageIndex === -1) {
        return {};
      }

      // update existing message
      const updatedMessages = sessionMessages.map((msg) => {
        if (msg.info.id !== messageId) return msg;

        return {
          ...msg,
          parts: msg.parts.map((p) =>
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
      const message = sessionMessages.findIndex(message => message.info.id === info.id)

      if (message !== -1) {
        // skip if message is exist
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
      }

    });
  },

  updateMessagePart: (info: Part) => {
    set((state) => {
      const sessionMessages = state.messages[info.sessionID] || [];

      const updatedMessages = sessionMessages.map((sessionMessage) => {
        if (sessionMessage.info.id !== info.messageID) {
          return sessionMessage;
        }

        const partIndex = sessionMessage.parts.findIndex(
          (p) => p.id === info.id
        );

        if (partIndex !== -1) {
          // update part
          const newParts = [...sessionMessage.parts];
          newParts[partIndex] = info;

          return {
            ...sessionMessage,
            parts: newParts
          };
        }

        // add part
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

  handleEvent: (event: Event) => {
    switch (event.type) {
      case "message.updated": {
        const props = event.properties;
        get().updateMessage(props.info);
        break;
      }

      case "message.part.updated": {
        const props = event.properties;
        get().updateMessagePart(props.part);
        break;
      }

      case "message.part.delta": {
        const props = event.properties;
        get().appendStreamChunk(props.sessionID, props.messageID, props.delta);
        break;
      }
    }
  }
}));
