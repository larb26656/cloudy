// src/stores/messageStore.ts
import { create } from "zustand";

// src/lib/client.ts
var _oc = null;
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

// src/stores/chatUIStore.ts
import { create as create6 } from "zustand";
import { persist as persist4 } from "zustand/middleware";
var useChatUIStore = create6()(
  persist4(
    (set) => ({
      deviceType: "desktop",
      sidebarOpen: false,
      sidebarWidth: 0,
      isDarkMode: false,
      setDeviceType: (deviceType) => set({ deviceType }),
      toggleSidebar: () => set((state) => {
        const newValue = !state.sidebarOpen;
        return { sidebarOpen: newValue };
      }),
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },
      setSidebarWidth: (width) => {
        const clampedWidth = Math.max(200, Math.min(400, width));
        set({ sidebarWidth: clampedWidth });
      },
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode }))
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
        isDarkMode: state.isDarkMode
      })
    }
  )
);

// src/stores/directoryStore.ts
import { create as create7 } from "zustand";
import { persist as persist5 } from "zustand/middleware";
var useDirectoryStore = create7()(
  persist5(
    (set) => ({
      directories: [],
      selectedDirectory: null,
      recentDirectories: [],
      isLoading: false,
      error: null,
      setSelectedDirectory: (directory) => {
        set({ selectedDirectory: directory });
      },
      addRecentDirectory: (directory) => set((state) => {
        const updated = [directory, ...state.recentDirectories.filter((d) => d !== directory)].slice(0, 5);
        return { recentDirectories: updated };
      }),
      searchDirectories: async (query) => {
        set({ isLoading: true, error: null });
        const oc = getOc();
        const result = await oc.find.files({
          query,
          type: "directory",
          limit: 10
        });
        if (result.error) {
          set({ error: getErrorMessage(result.error), isLoading: false });
          return;
        }
        const data = result.data;
        set({ isLoading: false, directories: data });
      }
    }),
    {
      name: "directory-storage",
      partialize: (state) => ({
        selectedDirectory: state.selectedDirectory,
        recentDirectories: state.recentDirectories
      })
    }
  )
);

// src/stores/findFileStore.ts
import { create as create8 } from "zustand";
var useFindFileStore = create8()(
  (set) => ({
    results: [],
    isLoading: false,
    error: null,
    searchFiles: async (directory, query, options) => {
      set({ isLoading: true, error: null });
      try {
        const oc = getOc();
        const result = await oc.find.files({
          directory,
          query,
          type: options?.type,
          limit: options?.limit ?? 10
        });
        if (result.error) {
          throw new Error(getErrorMessage(result.error));
        }
        const files = result.data ?? [];
        set({ results: files, isLoading: false });
        return files;
      } catch (err) {
        const message = err.message;
        set({ error: message, isLoading: false, results: [] });
        return [];
      }
    },
    clearResults: () => {
      set({ results: [], error: null });
    }
  })
);

// src/stores/memoryStore.ts
import { create as create9 } from "zustand";

// src/lib/front-matter.ts
function parseFrontMatter(markdown, fallbackTitle) {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n?/;
  const match = markdown.match(frontMatterRegex);
  if (!match) {
    return {
      meta: {
        title: fallbackTitle,
        tags: []
      },
      content: markdown,
      raw: markdown
    };
  }
  const metaString = match[1];
  const content = markdown.slice(match[0].length);
  const meta = {
    title: fallbackTitle,
    tags: []
  };
  for (const line of (metaString ?? "").split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    switch (key) {
      case "title":
        meta.title = value || fallbackTitle;
        break;
      case "tags":
        try {
          if (value.startsWith("[")) {
            meta.tags = JSON.parse(value.replace(/'/g, '"'));
          } else {
            meta.tags = value.split(",").map((t) => t.trim()).filter(Boolean);
          }
        } catch {
          meta.tags = [];
        }
        break;
      case "createdAt":
      case "updatedAt":
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
          meta[key] = value;
        }
        break;
    }
  }
  return { meta, content, raw: markdown };
}
function stringifyFrontMatter(meta, content) {
  const parts = ["---"];
  if (meta.title) {
    parts.push(`title: "${meta.title}"`);
  }
  if (meta.tags && meta.tags.length > 0) {
    parts.push(`tags: [${meta.tags.map((t) => `"${t}"`).join(", ")}]`);
  }
  if (meta.createdAt) {
    parts.push(`createdAt: ${meta.createdAt}`);
  }
  if (meta.updatedAt) {
    parts.push(`updatedAt: ${meta.updatedAt}`);
  }
  parts.push("---\n");
  return parts.join("\n") + content;
}

// src/stores/memoryStore.ts
function memoryFromMarkdown(name, markdown, id) {
  const parsed = parseFrontMatter(markdown, name);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id: id || crypto.randomUUID(),
    name,
    markdown,
    content: parsed.content.trim(),
    meta: {
      title: parsed.meta.title || name,
      tags: parsed.meta.tags || [],
      createdAt: parsed.meta.createdAt || now,
      updatedAt: parsed.meta.updatedAt || now
    }
  };
}
var mockMemories = [
  memoryFromMarkdown(
    "Project Architecture",
    `---
title: Project Architecture
tags: ["architecture", "design"]
createdAt: 2024-01-15
updatedAt: 2024-01-20
---

# Project Architecture

## Core Principles
- Modular design with clear separation of concerns
- State management using Zustand
- Type-safe with TypeScript

## Key Patterns
1. Feature-based organization
2. Component composition
3. Store-driven state management`,
    "1"
  ),
  memoryFromMarkdown(
    "API Integration Notes",
    `# API Integration Notes

## Authentication
- Uses SDK client with base URL configuration
- Error handling with typed error responses

## Endpoints Used
- \`session.list\` - Get sessions
- \`session.create\` - Create new session
- \`message.send\` - Send messages`,
    "2"
  ),
  memoryFromMarkdown(
    "UI Component Patterns",
    `---
title: UI Component Patterns
tags: ["ui", "components"]
createdAt: 2024-03-01
updatedAt: 2024-03-05
---

# UI Component Patterns

## Component Structure
- Use Radix UI primitives for accessibility
- Tailwind CSS for styling
- Variant-based theming with cva

## Example
\`\`\`tsx
function Button({ variant = 'default', size = 'default' }) {
  return <button className={buttonVariants({ variant, size })} />;
}
\`\`\``,
    "3"
  ),
  memoryFromMarkdown(
    "Routing Setup",
    `# Routing Setup

## File-based Routing
- Routes defined in \`/routes\` directory
- Layout routes with \`_prefix\`
- Nested routes for sub-pages

## Navigation
- Use \`Link\` component for client-side navigation
- \`useLocation\` for path checking`,
    "4"
  )
];
var useMemoryStore = create9()(
  (set, get) => ({
    memories: [],
    selectedMemoryId: null,
    isLoading: false,
    searchQuery: "",
    loadMemories: async () => {
      set({ isLoading: true });
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ memories: mockMemories, isLoading: false });
    },
    createMemory: (memoryData) => {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const meta = {
        title: memoryData.name,
        tags: [],
        createdAt: now,
        updatedAt: now
      };
      const newMemory = {
        ...memoryData,
        meta,
        id: crypto.randomUUID()
      };
      newMemory.markdown = stringifyFrontMatter(meta, memoryData.content);
      set((state) => ({ memories: [newMemory, ...state.memories] }));
      return newMemory;
    },
    updateMemory: (id, updates) => {
      set((state) => ({
        memories: state.memories.map((m) => {
          if (m.id !== id) return m;
          const updated = { ...m, ...updates };
          const meta = {
            ...m.meta,
            ...updates.meta,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          updated.meta = meta;
          updated.markdown = stringifyFrontMatter(meta, updated.content);
          return updated;
        })
      }));
    },
    deleteMemory: (id) => {
      set((state) => ({
        memories: state.memories.filter((m) => m.id !== id),
        selectedMemoryId: state.selectedMemoryId === id ? null : state.selectedMemoryId
      }));
    },
    selectMemory: (id) => {
      set({ selectedMemoryId: id });
    },
    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },
    getFilteredMemories: () => {
      const { memories, searchQuery } = get();
      if (!searchQuery.trim()) return memories;
      const query = searchQuery.toLowerCase();
      return memories.filter(
        (m) => m.name.toLowerCase().includes(query) || m.content.toLowerCase().includes(query) || m.meta.title?.toLowerCase().includes(query) || m.meta.tags.some((t) => t.toLowerCase().includes(query))
      );
    }
  })
);

// src/stores/permissionStore.ts
import { create as create10 } from "zustand";
import { persist as persist6 } from "zustand/middleware";
var usePermissionStore = create10()(
  persist6(
    (set, get) => ({
      permissions: {},
      isLoading: false,
      error: null,
      dismissed: false,
      loadPermissions: async (directory) => {
        set({ isLoading: true, error: null });
        const oc = getOc();
        const result = await oc.permission.list({ directory });
        if (result.error) {
          set({ error: getErrorMessage(result.error), isLoading: false });
          return;
        }
        const permissionList = result.data || [];
        const grouped = {};
        for (const permission of permissionList) {
          if (!grouped[permission.sessionID]) {
            grouped[permission.sessionID] = [];
          }
          grouped[permission.sessionID].push(permission);
        }
        set({
          permissions: grouped,
          isLoading: false,
          dismissed: false
        });
      },
      replyPermission: async (requestID, reply, directory) => {
        set({ error: null });
        const oc = getOc();
        const result = await oc.permission.reply({
          requestID,
          reply,
          directory
        });
        if (result.error) {
          set({ error: getErrorMessage(result.error) });
          return;
        }
        const { permissions } = get();
        const newPermissions = { ...permissions };
        for (const sessionId of Object.keys(newPermissions)) {
          newPermissions[sessionId] = newPermissions[sessionId].filter(
            (p) => p.id !== requestID
          );
          if (newPermissions[sessionId].length === 0) {
            delete newPermissions[sessionId];
          }
        }
        set({ permissions: newPermissions });
      },
      dismissNotification: () => {
        set({ dismissed: true });
      },
      restoreNotification: () => {
        set({ dismissed: false });
      },
      clearPermissionsForSession: (sessionId) => {
        set((state) => {
          const newPermissions = { ...state.permissions };
          delete newPermissions[sessionId];
          return { permissions: newPermissions };
        });
      },
      removePermission: (sessionId, requestId) => {
        set((state) => {
          const newPermissions = { ...state.permissions };
          if (newPermissions[sessionId]) {
            newPermissions[sessionId] = newPermissions[sessionId].filter(
              (p) => p.id !== requestId
            );
            if (newPermissions[sessionId].length === 0) {
              delete newPermissions[sessionId];
            }
          }
          return { permissions: newPermissions };
        });
      },
      addPermission: (permission) => {
        set((state) => {
          const newPermissions = { ...state.permissions };
          if (!newPermissions[permission.sessionID]) {
            newPermissions[permission.sessionID] = [];
          }
          const exists = newPermissions[permission.sessionID].some(
            (p) => p.id === permission.id
          );
          if (!exists) {
            newPermissions[permission.sessionID].push(permission);
          }
          return { permissions: newPermissions, dismissed: false };
        });
      }
    }),
    {
      name: "permission-storage",
      partialize: (state) => ({
        dismissed: state.dismissed
      })
    }
  )
);
export {
  useAgentStore,
  useChatUIStore,
  useDirectoryStore,
  useFindFileStore,
  useMemoryStore,
  useMessageStore,
  useModelStore,
  usePermissionStore,
  useQuestionStore,
  useSessionStore
};
//# sourceMappingURL=stores.js.map