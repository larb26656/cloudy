import { create } from 'zustand';
import { oc } from '@/lib/opencode';
import type { Message, SessionMessagesResponse, Event, Part } from '@opencode-ai/sdk/v2';
import type { ToolExecution, ModelConfig } from '../types';
import { useUIStore } from './uiStore';

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
  isThinking: boolean;
  currentDirectory: string | null;

  // Phase 2: Thinking content
  thinkingContent: Record<string, string>;
  thinkingState: Record<string, 'active' | 'complete' | null>;

  // Phase 2: Tool executions
  toolExecutions: Record<string, ToolExecution[]>;

  // Phase 2: Selected model
  selectedModel: ModelConfig | null;

  loadMessages: (sessionId: string) => Promise<void>;
  sendMessage: (sessionId: string, text: string, model?: ModelConfig | null) => Promise<void>;
  abortGeneration: (sessionId: string) => Promise<void>;
  appendStreamChunk: (sessionId: string, messageId: string, delta: string) => void;
  updateMessage: (message: Message) => void;
  updateMessagePart: (part: Part) => void;
  setCurrentDirectory: (directory: string | null) => void;
  clearMessages: (sessionId: string) => void;
  handleEvent: (event: Event) => void;

  // Phase 2: Thinking actions
  setThinkingState: (messageId: string, state: 'active' | 'complete') => void;
  appendThinkingText: (messageId: string, text: string) => void;

  // Phase 2: Tool actions
  addToolExecution: (messageId: string, tool: ToolExecution) => void;
  updateToolProgress: (messageId: string, toolId: string, progress: { progress: number; status: string }) => void;
  completeToolExecution: (messageId: string, toolId: string, result: { result?: unknown; error?: string; status: 'complete' | 'error' }) => void;

  // Phase 2: Model actions
  setSelectedModel: (model: ModelConfig | null) => void;
}

export const useMessageStoreV2 = create<MessageState>((set, get) => ({
  messages: {},
  streamingMessageIds: {},
  isLoading: false,
  error: null,
  isThinking: false,
  currentDirectory: null,
  thinkingContent: {},
  thinkingState: {},
  toolExecutions: {},
  selectedModel: null,

  setCurrentDirectory: (directory: string | null) => {
    set({ currentDirectory: directory });
  },

  clearMessages: (sessionId: string) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [],
      },
    }));
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

  sendMessage: async (sessionId: string, text: string, model?: ModelConfig | null) => {
    set({ error: null, isThinking: true });

    const directory = useUIStore.getState().selectedDirectory;

    if (!directory) {
      return;
    }

    const result = await oc.session.promptAsync({
      sessionID: sessionId,
      parts: [{ type: 'text', text }],
      model: model ?? undefined,
      directory: directory
    });

    set({ isThinking: false })

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

  handleEvent: (event: { type: string; properties: Record<string, unknown> }) => {
    const props = event.properties;
    const eventType = event.type;

    if (eventType === "message.updated") {
      get().updateMessage(props.info as Message);
      return;
    }

    if (eventType === "message.part.updated") {
      get().updateMessagePart(props.part as Part);
      return;
    }

    if (eventType === "message.part.delta") {
      get().appendStreamChunk(props.sessionID as string, props.messageID as string, props.delta as string);
      return;
    }

    // Phase 2: Handle reasoning events
    if (eventType === "reasoning.start") {
      get().setThinkingState(props.messageID as string, 'active');
      return;
    }
    if (eventType === "reasoning.delta") {
      get().appendThinkingText(props.messageID as string, props.text as string);
      return;
    }
    if (eventType === "reasoning.complete") {
      get().setThinkingState(props.messageID as string, 'complete');
      return;
    }

    // Phase 2: Handle tool events
    if (eventType === "tool.start") {
      get().addToolExecution(props.messageID as string, {
        id: props.partID as string,
        tool: props.tool as string,
        arguments: props.arguments as Record<string, unknown>,
        status: 'running',
        progress: 0,
        startTime: Date.now(),
      });
      return;
    }
    if (eventType === "tool.progress") {
      get().updateToolProgress(props.messageID as string, props.partID as string, {
        progress: props.progress as number,
        status: props.status as string,
      });
      return;
    }
    if (eventType === "tool.complete") {
      get().completeToolExecution(props.messageID as string, props.partID as string, {
        result: props.result,
        status: 'complete',
      });
      return;
    }
    if (eventType === "tool.error") {
      get().completeToolExecution(props.messageID as string, props.partID as string, {
        error: props.error as string,
        status: 'error',
      });
      return;
    }
  },

  // Phase 2: Thinking actions
  setThinkingState: (messageId: string, state: 'active' | 'complete') => {
    set((prev) => ({
      thinkingState: { ...prev.thinkingState, [messageId]: state },
    }));
  },

  appendThinkingText: (messageId: string, text: string) => {
    set((prev) => ({
      thinkingContent: {
        ...prev.thinkingContent,
        [messageId]: (prev.thinkingContent[messageId] || '') + text,
      },
    }));
  },

  // Phase 2: Tool actions
  addToolExecution: (messageId: string, tool: ToolExecution) => {
    set((prev) => ({
      toolExecutions: {
        ...prev.toolExecutions,
        [messageId]: [...(prev.toolExecutions[messageId] || []), tool],
      },
    }));
  },

  updateToolProgress: (messageId: string, toolId: string, progress: { progress: number; status: string }) => {
    set((prev) => {
      const tools = prev.toolExecutions[messageId] || [];
      return {
        toolExecutions: {
          ...prev.toolExecutions,
          [messageId]: tools.map((t) =>
            t.id === toolId
              ? { ...t, progress: progress.progress, status: 'running' as const }
              : t
          ),
        },
      };
    });
  },

  completeToolExecution: (messageId: string, toolId: string, result: { result?: unknown; error?: string; status: 'complete' | 'error' }) => {
    set((prev) => {
      const tools = prev.toolExecutions[messageId] || [];
      return {
        toolExecutions: {
          ...prev.toolExecutions,
          [messageId]: tools.map((t) =>
            t.id === toolId
              ? { ...t, status: result.status, result: result.result, error: result.error, endTime: Date.now() }
              : t
          ),
        },
      };
    });
  },

  // Phase 2: Model actions
  setSelectedModel: (model: ModelConfig | null) => {
    set({ selectedModel: model });
  },
}));
