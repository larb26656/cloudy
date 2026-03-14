// stores/messageStore.ts
import { create } from 'zustand';
import { messagesApi, sessionsApi } from '../api';
import type { Message, TextPart, ApiEvent, ToolExecution, ModelConfig } from '../types';

interface MessageState {
  messages: Record<string, Message[]>; // sessionId -> messages
  streamingMessageIds: Record<string, string | null>; // sessionId -> messageId
  isLoading: boolean;
  error: string | null;

  // Phase 2: Thinking content
  thinkingContent: Record<string, string>; // messageID -> thinking text
  thinkingState: Record<string, 'active' | 'complete' | null>; // messageID -> state

  // Phase 2: Tool executions
  toolExecutions: Record<string, ToolExecution[]>; // messageID -> tools

  // Phase 2: Selected model
  selectedModel: ModelConfig | null;

  // Actions
  loadMessages: (sessionId: string) => Promise<void>;
  sendMessage: (sessionId: string, text: string, model?: ModelConfig | null) => Promise<void>;
  abortGeneration: (sessionId: string) => Promise<void>;
  appendStreamChunk: (sessionId: string, messageId: string, delta: string) => void;
  addMessagePart: (sessionId: string, messageId: string, part: TextPart) => void;
  handleEvent: (event: ApiEvent) => void;
  clearMessages: (sessionId: string) => void;

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
export const useMessageStore = create<MessageState>((set, get) => ({
  messages: {},
  streamingMessageIds: {},
  isLoading: false,
  error: null,
  thinkingContent: {},
  thinkingState: {},
  toolExecutions: {},
  selectedModel: null,

  loadMessages: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const messages = await messagesApi.list(sessionId);
      set((state) => ({
        messages: { ...state.messages, [sessionId]: messages },
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  sendMessage: async (sessionId: string, text: string, model?: ModelConfig | null) => {
    const tempId = `temp_${Date.now()}`;

    // Optimistic update - add user message
    set((state) => {
      const sessionMessages = state.messages[sessionId] || [];
      const userMessage: Message = {
        info: {
          id: tempId,
          sessionID: sessionId,
          role: 'user',
          time: { created: Date.now() },
        },
        parts: [{ type: 'text', text } as TextPart],
      };
      return {
        messages: {
          ...state.messages,
          [sessionId]: [...sessionMessages, userMessage],
        },
      };
    });

    try {
      // Send to API with optional model
      const requestBody: { parts: { type: 'text'; text: string }[]; model?: ModelConfig } = {
        parts: [{ type: 'text', text }],
      };

      if (model) {
        requestBody.model = model;
      }

      await messagesApi.send(sessionId, requestBody);

      // The response will come through SSE, but also reload messages after a delay
      // to ensure we get the AI response even if SSE events are missed
      setTimeout(() => {
        get().loadMessages(sessionId);
      }, 1000);
    } catch (error) {
      // Remove temp message on error
      set((state) => ({
        messages: {
          ...state.messages,
          [sessionId]: state.messages[sessionId]?.filter((m) => m.info.id !== tempId) || [],
        },
        error: (error as Error).message,
      }));
    }
  },

  abortGeneration: async (sessionId: string) => {
    try {
      await sessionsApi.abort(sessionId);
      set((state) => ({
        streamingMessageIds: { ...state.streamingMessageIds, [sessionId]: null },
      }));
    } catch (error) {
      console.error('Failed to abort:', error);
    }
  },

  appendStreamChunk: (sessionId: string, messageId: string, delta: string) => {
    set((state) => {
      const sessionMessages = state.messages[sessionId] || [];
      const messageIndex = sessionMessages.findIndex((m) => m.info.id === messageId);

      if (messageIndex === -1) {
        // New streaming message
        const newMessage: Message = {
          info: {
            id: messageId,
            sessionID: sessionId,
            role: 'assistant',
            time: { created: Date.now() },
          },
          parts: [{ type: 'text', text: delta } as TextPart],
        };
        return {
          messages: {
            ...state.messages,
            [sessionId]: [...sessionMessages, newMessage],
          },
          streamingMessageIds: {
            ...state.streamingMessageIds,
            [sessionId]: messageId,
          },
        };
      }

      // Append to existing message
      const updatedMessages = [...sessionMessages];
      const message = updatedMessages[messageIndex];
      const textPart = message.parts.find((p) => p.type === 'text') as TextPart | undefined;

      if (textPart) {
        textPart.text += delta;
      } else {
        message.parts.push({ type: 'text', text: delta } as TextPart);
      }

      return {
        messages: {
          ...state.messages,
          [sessionId]: updatedMessages,
        },
      };
    });
  },

  addMessagePart: (sessionId: string, messageId: string, part: TextPart) => {
    set((state) => {
      const sessionMessages = state.messages[sessionId] || [];
      const messageIndex = sessionMessages.findIndex((m) => m.info.id === messageId);

      if (messageIndex === -1) {
        // Create new message with this part
        const newMessage: Message = {
          info: {
            id: messageId,
            sessionID: sessionId,
            role: 'assistant',
            time: { created: Date.now() },
          },
          parts: [part],
        };
        return {
          messages: {
            ...state.messages,
            [sessionId]: [...sessionMessages, newMessage],
          },
        };
      }

      // Add part to existing message
      const updatedMessages = [...sessionMessages];
      updatedMessages[messageIndex].parts.push(part);

      return {
        messages: {
          ...state.messages,
          [sessionId]: updatedMessages,
        },
      };
    });
  },

  handleEvent: (event: ApiEvent) => {
    switch (event.event) {
      case 'message.part.delta':
        get().appendStreamChunk(event.sessionID, event.messageID, event.delta);
        break;
      case 'message.part.updated':
        if (event.part && typeof event.part === 'object' && 'type' in event.part) {
          get().addMessagePart(event.sessionID, event.messageID, event.part as TextPart);
        }
        break;
      case 'session.idle':
        set((state) => ({
          streamingMessageIds: {
            ...state.streamingMessageIds,
            [event.sessionID]: null,
          },
        }));
        break;

      // Phase 2: Handle reasoning events
      case 'reasoning.start':
        get().setThinkingState(event.messageID, 'active');
        break;
      case 'reasoning.delta':
        get().appendThinkingText(event.messageID, event.text);
        break;
      case 'reasoning.complete':
        get().setThinkingState(event.messageID, 'complete');
        break;

      // Phase 2: Handle tool events
      case 'tool.start':
        get().addToolExecution(event.messageID, {
          id: event.partID,
          tool: event.tool,
          arguments: event.arguments,
          status: 'running',
          progress: 0,
          startTime: Date.now(),
        });
        break;
      case 'tool.progress':
        get().updateToolProgress(event.messageID, event.partID, {
          progress: event.progress,
          status: event.status,
        });
        break;
      case 'tool.complete':
        get().completeToolExecution(event.messageID, event.partID, {
          result: event.result,
          status: 'complete',
        });
        break;
      case 'tool.error':
        get().completeToolExecution(event.messageID, event.partID, {
          error: event.error,
          status: 'error',
        });
        break;
    }
  },

  clearMessages: (sessionId: string) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [],
      },
    }));
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
