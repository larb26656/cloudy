import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SessionData = {
  sessionId: string | null;
  workspaceId: string;
  sessionName: string;
};

export type DeskData = Record<string, never>;

export type WebviewData = {
  url: string;
  history: string[];
  historyIndex: number;
};

export type Tab =
  | { id: string; type: "session"; data: SessionData }
  | { id: string; type: "desk"; data: DeskData }
  | { id: string; type: "webview"; data: WebviewData };

interface TabStore {
  tabs: Tab[];
  activeTabId: string;
  addTab: {
    (type: "session", data: SessionData): string;
    (type: "desk", data: DeskData): string;
    (type: "webview", data: WebviewData): string;
  };
  getTab: (id: string) => Tab;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabData: (tabId: string, data: Partial<SessionData>) => void;
  webviewNavigate: (tabId: string, url: string) => void;
  webviewGoBack: (tabId: string) => void;
  webviewGoForward: (tabId: string) => void;
  clearAll: () => void;
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: "home",

      addTab: (type, data) => {
        const id = crypto.randomUUID();
        set((state) => ({
          tabs: [...state.tabs, { id, type, data } as Tab],
          activeTabId: id,
        }));
        return id;
      },

      getTab: (id) => {
        const tab = get().tabs.find((t: Tab) => t.id === id);
        if (!tab) throw new Error(`Tab ${id} not found`);
        return tab;
      },

      removeTab: (id) => {
        set((state) => {
          const tabs = state.tabs.filter((t) => t.id !== id);
          const activeTabId =
            state.activeTabId === id
              ? tabs.length > 0
                ? tabs[tabs.length - 1].id
                : "home"
              : state.activeTabId;
          return { tabs, activeTabId };
        });
      },

      setActiveTab: (id) => set({ activeTabId: id }),

      updateTabData: (tabId, data) => {
        set((state) => ({
          tabs: state.tabs.map((t) => {
            if (t.id !== tabId || t.type !== "session") return t;
            return { ...t, data: { ...t.data, ...data } };
          }),
        }));
      },

      webviewNavigate: (tabId, url) => {
        set((state) => ({
          tabs: state.tabs.map((t) => {
            if (t.id !== tabId || t.type !== "webview") return t;
            const newHistory = t.data.history.slice(0, t.data.historyIndex + 1);
            newHistory.push(url);
            return {
              ...t,
              data: { ...t.data, url, history: newHistory, historyIndex: newHistory.length - 1 },
            };
          }),
        }));
      },

      webviewGoBack: (tabId) => {
        set((state) => ({
          tabs: state.tabs.map((t) => {
            if (t.id !== tabId || t.type !== "webview") return t;
            if (t.data.historyIndex <= 0) return t;
            const newIndex = t.data.historyIndex - 1;
            return {
              ...t,
              data: { ...t.data, url: t.data.history[newIndex], historyIndex: newIndex },
            };
          }),
        }));
      },

      webviewGoForward: (tabId) => {
        set((state) => ({
          tabs: state.tabs.map((t) => {
            if (t.id !== tabId || t.type !== "webview") return t;
            if (t.data.historyIndex >= t.data.history.length - 1) return t;
            const newIndex = t.data.historyIndex + 1;
            return {
              ...t,
              data: { ...t.data, url: t.data.history[newIndex], historyIndex: newIndex },
            };
          }),
        }));
      },

      clearAll: () => set({ tabs: [], activeTabId: "home" }),
    }),
    { name: "tabs", partialize: (state) => ({ tabs: state.tabs }) },
  ),
);
