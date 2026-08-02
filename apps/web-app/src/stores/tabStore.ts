import { create } from "zustand";
import { persist } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";
import { generateId } from "@/lib/id";
import { tabTypeMap, type Tab, type TabDataMap } from "@/features/home/tabs/template";

interface TabStore {
  tabs: Tab[];
  activeTabId: string;
  addTab: <T extends Tab["type"]>(type: T, data: TabDataMap[T]) => string;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  reorderTabs: (activeId: string, overId: string) => void;
  updateTabData: <T extends Tab>(
    tabId: string,
    data: Partial<T["data"]>,
  ) => void;
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
          tabTypeMap[tab.type]?.onClose?.(tab);
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
    }),
    {
      name: "tabs",
      version: 3,
      migrate: (persistedState, version) => {
        // Persisted shapes may predate the current `Tab` union, so read them
        // through a looser type. Old versions stored `type: "session"` which
        // no longer exists in the union.
        type PersistedTab = { id: string; type: string; data: unknown };
        type Persisted = { tabs?: PersistedTab[]; activeTabId?: string };
        const state = persistedState as Persisted | undefined;
        if (!state?.tabs) return persistedState;

        let tabs = state.tabs;

        // v1 -> v2: rename the "session" tab type to "chat".
        if (version < 2) {
          tabs = tabs.map((t) =>
            t.type === "session" ? { ...t, type: "chat" } : t,
          );
        }

        // v2 -> v3: terminal PTY ids are runtime-only (the opencode server
        // owns the PTY lifecycle); strip any stale id so a fresh one is
        // spawned on load instead of connecting to a dead session.
        if (version < 3) {
          tabs = tabs.map((t) =>
            t.type === "terminal"
              ? {
                  ...t,
                  data: {
                    ...(t.data as Record<string, unknown>),
                    ptyId: null,
                  },
                }
              : t,
          );
        }

        // v0 -> v1: drop stale "files" tabs missing a workspaceId.
        const filtered = tabs.filter(
          (t) =>
            !(
              t.type === "files" &&
              !(t.data as { workspaceId?: string } | undefined)?.workspaceId
            ),
        );
        let activeTabId = state.activeTabId;
        if (
          activeTabId &&
          activeTabId !== "home" &&
          !filtered.some((t) => t.id === activeTabId)
        ) {
          activeTabId =
            filtered.length > 0 ? filtered[filtered.length - 1]!.id : "home";
        }
        return { ...state, tabs: filtered, activeTabId } as unknown as {
          tabs: Tab[];
          activeTabId: string;
        };
      },
    },
  ),
);

export type { Tab, TabDataMap };
