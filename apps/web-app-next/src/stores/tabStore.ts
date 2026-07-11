import { create } from "zustand";
import { persist } from "zustand/middleware";

type SessionData = {
  sessionId: string;
  workspaceId: string;
  sessionName: string;
};

type Tab = { id: string; type: "session"; data: SessionData };

interface TabStore {
  tabs: Tab[];
  activeTabId: string;
  addTab: {
    (type: "session", data: SessionData): string;
  };
  getTab: (id: string) => Tab;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
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

      clearAll: () => set({ tabs: [], activeTabId: "home" }),
    }),
    { name: "tabs", partialize: (state) => ({ tabs: state.tabs }) },
  ),
);
