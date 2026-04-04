// src/lib/client.ts
var _oc = null;
function initCoreChat(oc) {
  _oc = oc;
}
function getOc() {
  if (!_oc) {
    throw new Error("CoreChat not initialized. Call initCoreChat(oc) first.");
  }
  return _oc;
}
function getErrorMessage(error) {
  if (error.message) return error.message;
  if (error.errors && error.errors.length > 0) {
    const firstError = error.errors[0];
    if (firstError?.message) {
      return firstError.message;
    }
  }
  if (error.data && typeof error.data === "object" && "message" in error.data) {
    return String(error.data.message);
  }
  return "Unknown error";
}
function createDefaultTitle(isChild = false) {
  const prefix = isChild ? "Child session - " : "New session - ";
  return prefix + (/* @__PURE__ */ new Date()).toISOString();
}

// src/types.ts
function buildParts(directory, content) {
  const textPart = { type: "text", text: content.text };
  const mentionParts = content.mentions.map((mention) => {
    const filename = mention.id;
    const path = `${directory}/${filename}`;
    const url = `file://${path}`;
    return {
      type: "file",
      mime: "text/plain",
      url,
      filename,
      source: {
        type: "file",
        text: {
          value: filename,
          start: 0,
          end: filename.length
        },
        path
      }
    };
  });
  return [textPart, ...mentionParts];
}

// src/stores/messageStore.ts
import { create } from "zustand";
var useMessageStore = create()(
  (set) => ({
    messages: {},
    streamingMessageIds: {},
    isLoading: false,
    error: null,
    isThinking: false,
    thinkingContent: {},
    thinkingState: {},
    clearMessages: (sessionId) => {
      set((state) => ({
        messages: {
          ...state.messages,
          [sessionId]: []
        }
      }));
    },
    loadMessages: async (sessionId) => {
      set({ isLoading: true, error: null });
      const oc = getOc();
      const result = await oc.session.messages({
        sessionID: sessionId
      });
      if (result.error) {
        set({ error: getErrorMessage(result.error), isLoading: false });
        return;
      }
      const data = result.data;
      set((state) => ({
        messages: { ...state.messages, [sessionId]: data },
        isLoading: false
      }));
    },
    sendMessage: async (directory, sessionId, content, model, agent) => {
      set({ error: null, isThinking: true });
      const oc = getOc();
      const parts = buildParts(directory, content);
      await oc.session.promptAsync({
        sessionID: sessionId,
        parts,
        model: model ?? void 0,
        agent: agent ?? void 0
      }, {
        headers: { "x-opencode-directory": directory }
      });
      set({ isThinking: false });
    },
    abortGeneration: async (directory, sessionId) => {
      set({ error: null });
      const oc = getOc();
      const result = await oc.session.abort({ sessionID: sessionId }, {
        headers: { "x-opencode-directory": directory }
      });
      if (result.error) {
        set({ error: getErrorMessage(result.error) });
        return;
      }
      set((state) => ({
        streamingMessageIds: { ...state.streamingMessageIds, [sessionId]: null }
      }));
    },
    appendStreamChunk: (sessionId, messageId, delta) => {
      set((state) => {
        const sessionMessages = state.messages[sessionId] || [];
        const messageIndex = sessionMessages.findIndex(
          (m) => m.info.id === messageId
        );
        if (messageIndex === -1) {
          return {};
        }
        const updatedMessages = sessionMessages.map((msg) => {
          if (msg.info.id !== messageId) return msg;
          return {
            ...msg,
            parts: msg.parts.map(
              (p) => p.type === "text" ? { ...p, text: p.text + delta } : p
            )
          };
        });
        return {
          messages: {
            ...state.messages,
            [sessionId]: updatedMessages
          }
        };
      });
    },
    updateMessage: (info) => {
      set((state) => {
        const sessionMessages = state.messages[info.sessionID] || [];
        const message = sessionMessages.findIndex((m) => m.info.id === info.id);
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
    updateMessagePart: (info) => {
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
    }
  })
);

// src/stores/sessionStore.ts
import { create as create2 } from "zustand";
var useSessionStore = create2()(
  (set) => ({
    sessions: [],
    selectedSessionId: null,
    sessionStatuses: {},
    isLoading: false,
    error: null,
    activeQuestion: null,
    loadSessions: async (directory) => {
      set({ isLoading: true, error: null });
      const oc = getOc();
      const result = await oc.session.list({ directory, limit: 20 });
      if (result.error) {
        set({ error: getErrorMessage(result.error), isLoading: false });
        return;
      }
      const data = result.data;
      set({ isLoading: false, sessions: data });
    },
    createSession: async (directory, title) => {
      const oc = getOc();
      const result = await oc.session.create({
        title: title || createDefaultTitle(),
        directory
      });
      if (result.error) {
        const message = getErrorMessage(result.error);
        throw new Error(message);
      }
      const session = result.data;
      return session;
    },
    createTempSession: () => {
      set({
        selectedSessionId: null
      });
    },
    setCreateSession: (session) => {
      set((state) => ({
        sessions: [session, ...state.sessions],
        selectedSessionId: session.id
      }));
    },
    selectSession: (sessionId) => {
      set({ selectedSessionId: sessionId });
    },
    updateSession: async (sessionId, title) => {
      set({ error: null });
      const oc = getOc();
      const result = await oc.session.update({
        sessionID: sessionId,
        title
      });
      if (result.error) {
        set({ error: getErrorMessage(result.error) });
        return;
      }
      const updated = result.data;
      if (updated) {
        set((state) => ({
          sessions: state.sessions.map((s) => s.id === sessionId ? { ...s, ...updated } : s)
        }));
      }
    },
    deleteSession: async (sessionId) => {
      set({ error: null });
      const oc = getOc();
      const result = await oc.session.delete({ sessionID: sessionId });
      if (result.error) {
        set({ error: getErrorMessage(result.error) });
        return;
      }
      set((state) => {
        const newSessions = state.sessions.filter((s) => s.id !== sessionId);
        const newCurrentId = state.selectedSessionId === sessionId ? newSessions[0]?.id || null : state.selectedSessionId;
        return { sessions: newSessions, selectedSessionId: newCurrentId };
      });
    },
    forkSession: async (sessionId, messageId) => {
      set({ error: null });
      const oc = getOc();
      const result = await oc.session.fork({
        sessionID: sessionId,
        messageID: messageId
      });
      if (result.error) {
        set({ error: getErrorMessage(result.error) });
        return null;
      }
      const session = result.data;
      if (session) {
        set((state) => ({
          sessions: [session, ...state.sessions],
          selectedSessionId: session.id
        }));
      }
      return null;
    },
    updateSessionStatus: (sessionId, status) => {
      set((state) => ({
        sessionStatuses: { ...state.sessionStatuses, [sessionId]: status }
      }));
    },
    updateSessionFromEvent: (session) => {
      set((state) => ({
        sessions: state.sessions.map((s) => s.id === session.id ? { ...s, ...session } : s)
      }));
    },
    addSession: (session) => {
      set((state) => ({
        sessions: [session, ...state.sessions]
      }));
    },
    removeSession: (sessionId) => {
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId)
      }));
    },
    setActiveQuestion: (question) => {
      set((state) => {
        if (question && state.activeQuestion && state.activeQuestion.id === question.id) {
          return state;
        }
        return { activeQuestion: question };
      });
    },
    clearActiveQuestion: () => {
      set({ activeQuestion: null });
    }
  })
);

// src/stores/agentStore.ts
import { create as create3 } from "zustand";
import { persist } from "zustand/middleware";
var useAgentStore = create3()(
  persist(
    (set) => ({
      selectedAgent: null,
      agents: [],
      isLoading: false,
      error: null,
      setSelectedAgent: (agent) => {
        set({ selectedAgent: agent });
      },
      fetchAgents: async () => {
        set({ isLoading: true, error: null });
        try {
          const oc = getOc();
          const result = await oc.app.agents();
          if (result.error) {
            throw new Error(getErrorMessage(result.error));
          }
          const data = result.data;
          if (Array.isArray(data)) {
            const agents = data.filter((a) => !a.hidden);
            set({ agents, isLoading: false });
          } else {
            set({ agents: [], isLoading: false });
          }
        } catch (err) {
          set({ error: err.message, isLoading: false, agents: [] });
        }
      }
    }),
    {
      name: "agent-storage",
      partialize: (state) => ({ selectedAgent: state.selectedAgent })
    }
  )
);

// src/stores/modelStore.ts
import { create as create4 } from "zustand";
import { persist as persist2 } from "zustand/middleware";
var useModelStore = create4()(
  persist2(
    (set) => ({
      selectedModel: null,
      providers: [],
      isLoading: false,
      error: null,
      setSelectedModel: (model) => {
        set({ selectedModel: model });
      },
      fetchProviders: async () => {
        set({ isLoading: true, error: null });
        try {
          const oc = getOc();
          const result = await oc.config.providers();
          if (result.error) {
            throw new Error(getErrorMessage(result.error));
          }
          const data = result.data;
          const mappedProviders = data.providers.map((p) => ({
            id: p.id,
            name: p.name,
            models: Object.values(p.models).filter((m) => m.status === "active").map((m) => ({
              providerID: p.id,
              modelID: m.id,
              name: m.name,
              description: `${m.family ?? ""} \u2022 ${m.limit.context.toLocaleString()} context`,
              maxTokens: m.limit.context,
              supportsStreaming: true,
              supportsTools: m.capabilities.toolcall
            }))
          })).filter((p) => p.models.length > 0);
          set({ providers: mappedProviders, isLoading: false });
        } catch (err) {
          set({ error: err.message, isLoading: false, providers: [] });
        }
      }
    }),
    {
      name: "model-storage",
      partialize: (state) => ({ selectedModel: state.selectedModel })
    }
  )
);

// src/stores/questionStore.ts
import { create as create5 } from "zustand";
import { persist as persist3 } from "zustand/middleware";
var useQuestionStore = create5()(
  persist3(
    (set, get) => ({
      questions: {},
      isLoading: false,
      error: null,
      dismissed: false,
      loadQuestions: async (directory) => {
        set({ isLoading: true, error: null });
        const oc = getOc();
        const result = await oc.question.list({ directory });
        if (result.error) {
          set({ error: getErrorMessage(result.error), isLoading: false });
          return;
        }
        const questionList = result.data || [];
        const grouped = {};
        for (const question of questionList) {
          if (!grouped[question.sessionID]) {
            grouped[question.sessionID] = [];
          }
          grouped[question.sessionID].push(question);
        }
        set({
          questions: grouped,
          isLoading: false,
          dismissed: false
        });
      },
      replyQuestion: async (requestID, answers, directory) => {
        set({ error: null });
        const oc = getOc();
        const result = await oc.question.reply({
          requestID,
          answers,
          directory
        });
        if (result.error) {
          set({ error: getErrorMessage(result.error) });
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
      rejectQuestion: async (requestID, directory) => {
        set({ error: null });
        const oc = getOc();
        const result = await oc.question.reject({ requestID, directory });
        if (result.error) {
          set({ error: getErrorMessage(result.error) });
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
      clearQuestionsForSession: (sessionId) => {
        set((state) => {
          const newQuestions = { ...state.questions };
          delete newQuestions[sessionId];
          return { questions: newQuestions };
        });
      },
      removeQuestion: (sessionId, requestId) => {
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
      addQuestion: (question) => {
        set((state) => {
          const newQuestions = { ...state.questions };
          if (!newQuestions[question.sessionID]) {
            newQuestions[question.sessionID] = [];
          }
          const sessionQuestions = newQuestions[question.sessionID];
          const exists = sessionQuestions.some((q) => q.id === question.id);
          if (!exists) {
            sessionQuestions.push(question);
          }
          return { questions: newQuestions, dismissed: false };
        });
      }
    }),
    {
      name: "question-storage",
      partialize: (state) => ({
        dismissed: state.dismissed
      })
    }
  )
);
export {
  buildParts,
  createDefaultTitle,
  getErrorMessage,
  getOc,
  initCoreChat,
  useAgentStore,
  useMessageStore,
  useModelStore,
  useQuestionStore,
  useSessionStore
};
//# sourceMappingURL=index.js.map