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
  activeTabId: string | null;
  addTab: {
    (type: "session", data: SessionData): string;
  };
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  clearAll: () => void;
}

export const useTabStore = create<TabStore>()(
  persist(
    (set) => ({
      tabs: [],
      activeTabId: null,

      addTab: (type, data) => {
        const id = crypto.randomUUID();
        set((state) => ({
          tabs: [...state.tabs, { id, type, data } as Tab],
          activeTabId: id,
        }));
        return id;
      },

      removeTab: (id) => {
        set((state) => {
          const tabs = state.tabs.filter((t) => t.id !== id);
          const activeTabId =
            state.activeTabId === id
              ? tabs.length > 0
                ? tabs[tabs.length - 1].id
                : 'home'
              : state.activeTabId;
          return { tabs, activeTabId };
        });
      },

      setActiveTab: (id) => set({ activeTabId: id }),

      clearAll: () => set({ tabs: [], activeTabId: null }),
    }),
    { name: "tabs" },
  ),
);
