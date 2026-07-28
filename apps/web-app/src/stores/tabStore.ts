import { create } from "zustand";
import { persist } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";
import { generateId } from "@/lib/id";
import { tabTypeMap, type Tab, type TabDataMap } from "@/features/home/tabs/template";

interface TabStore {
  tabs: Tab[];
  activeTabId: string;
  addTab: <T extends Tab["type"]>(type: T, data: TabDataMap[T]) => string;
  getTab: (id: string) => Tab;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  reorderTabs: (activeId: string, overId: string) => void;
  updateTabData: <T extends Tab>(
    tabId: string,
    data: Partial<T["data"]>,
  ) => void;
  clearAll: () => void;
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: "home",

      addTab: (type, data) => {
        const id = generateId();
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
        const tab = get().tabs.find((t) => t.id === id);
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
        if (tab) {
          tabTypeMap[tab.type]?.onClose?.(id);
        }
      },

      setActiveTab: (id) => set({ activeTabId: id }),

      reorderTabs: (activeId, overId) => {
        set((state) => {
          const oldIndex = state.tabs.findIndex((t) => t.id === activeId);
          const newIndex = state.tabs.findIndex((t) => t.id === overId);
          if (oldIndex === -1 || newIndex === -1) return {};
          return { tabs: arrayMove(state.tabs, oldIndex, newIndex) };
        });
      },

      updateTabData: (tabId, data) => {
        set((state) => ({
          tabs: state.tabs.map((t) => {
            if (t.id !== tabId) return t;
            return { ...t, data: { ...t.data, ...data } } as Tab;
          }),
        }));
      },

      clearAll: () => set({ tabs: [], activeTabId: "home" }),
    }),
    { name: "tabs" },
  ),
);

export type { Tab, TabDataMap };
