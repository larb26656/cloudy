import { create } from "zustand";
import { persist } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";
import { generateId } from "@/lib/id";
import {
  tabTypeMap,
  type Tab,
  type TabDataMap,
} from "@/features/home/tabs/template";

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

type PersistedTab = {
  id: string;
  type: string;
  data: unknown;
  updatedAt?: number;
};

export function removeTerminalWorkspaceIdentity(
  tabs: PersistedTab[],
): PersistedTab[] {
  return tabs.map((tab) => {
    if (tab.type !== "terminal") return tab;
    const data = tab.data as {
      directory?: string;
      ptyId?: string | null;
    };
    return {
      ...tab,
      data: {
        directory: data.directory ?? "",
        ptyId: data.ptyId ?? null,
      },
    };
  });
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: "home",

      addTab: (type, data) => {
        const id = generateId();
        const now = Date.now();
        set((state) => ({
          tabs: [...state.tabs, { id, type, data, updatedAt: now } as Tab],
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
            return {
              ...t,
              data: { ...t.data, ...data },
              updatedAt: Date.now(),
            } as Tab;
          }),
        }));
      },
    }),
    {
      name: "tabs",
      version: 7,
      migrate: (persistedState, version) => {
        // Persisted shapes may predate the current `Tab` union, so read them
        // through a looser type. Old versions stored `type: "session"` which
        // no longer exists in the union.
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

        // v3 -> v4: add `updatedAt` (ms epoch) used by the home "Recent"
        // section to sort/order desk tabs. Backfill with the current time so
        // every pre-existing tab has a valid value on first load.
        if (version < 4) {
          const now = Date.now();
          tabs = tabs.map((t) =>
            (t as { updatedAt?: number }).updatedAt === undefined
              ? { ...t, updatedAt: now }
              : t,
          );
        }

        // v4 -> v5: webview tabs no longer carry a hand-rolled history stack
        // (history[], historyIndex) — only the current `url` persists. The old
        // stack only tracked address-bar entries anyway (cross-origin iframes
        // can't be inspected), so dropping it loses no real functionality.
        if (version < 5) {
          tabs = tabs.map((t) => {
            if (t.type !== "webview") return t;
            const data = t.data as { url?: string } | undefined;
            return { ...t, data: { url: data?.url ?? "" } };
          });
        }

        // v5 -> v6: chat/files tabs now carry an explicit `directory` used for
        // all opencode calls, and `workspaceId` is nullable (null = ephemeral
        // session with no registered workspace). Old tabs only have
        // `workspaceId`. Backfill: if the persisted `workspaceId` looks like a
        // filesystem path (contains "/"), it was the old broken fallback —
        // promote it to `directory` and null the workspaceId. Otherwise keep
        // the workspaceId and leave `directory` empty; ChatContent/FilesContent
        // fall back to a runtime useWorkspace lookup to recover the directory.
        if (version < 6) {
          tabs = tabs.map((t) => {
            if (t.type !== "chat" && t.type !== "files") return t;
            const data = t.data as {
              workspaceId?: string;
              directory?: string;
            };
            if (data.directory) return t;
            const wid = data.workspaceId;
            const isPath = !!wid && wid.includes("/");
            return {
              ...t,
              data: {
                ...data,
                workspaceId: isPath ? null : (wid ?? null),
                directory: isPath ? wid : "",
              },
            };
          });
        }

        // v6 -> v7: terminal sessions are directory-based resources and no
        // longer retain workspace identity in persisted tab data.
        if (version < 7) {
          tabs = removeTerminalWorkspaceIdentity(tabs);
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
