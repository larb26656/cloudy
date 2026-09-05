import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChatPanelState {
  filesOpenByTabId: Record<string, boolean>;
  filesWidthByTabId: Record<string, number>;
  toggleFiles: (tabId: string) => void;
  setFilesOpen: (tabId: string, open: boolean) => void;
  setFilesWidth: (tabId: string, width: number) => void;
  clearTab: (tabId: string) => void;
  pruneExcept: (tabIds: ReadonlySet<string>) => void;
}

export const useChatPanelStore = create<ChatPanelState>()(
  persist(
    (set) => ({
      filesOpenByTabId: {},
      filesWidthByTabId: {},
      toggleFiles: (tabId) =>
        set((state) => ({
          filesOpenByTabId: {
            ...state.filesOpenByTabId,
            [tabId]: !state.filesOpenByTabId[tabId],
          },
        })),
      setFilesOpen: (tabId, open) =>
        set((state) => ({
          filesOpenByTabId: {
            ...state.filesOpenByTabId,
            [tabId]: open,
          },
        })),
      setFilesWidth: (tabId, width) =>
        set((state) => ({
          filesWidthByTabId: {
            ...state.filesWidthByTabId,
            [tabId]: width,
          },
        })),
      clearTab: (tabId) =>
        set((state) => {
          const { [tabId]: _open, ...filesOpenByTabId } =
            state.filesOpenByTabId;
          const { [tabId]: _width, ...filesWidthByTabId } =
            state.filesWidthByTabId;
          return { filesOpenByTabId, filesWidthByTabId };
        }),
      pruneExcept: (tabIds) =>
        set((state) => {
          const keep = <T>(record: Record<string, T>) =>
            Object.fromEntries(
              Object.entries(record).filter(([id]) => tabIds.has(id)),
            );
          return {
            filesOpenByTabId: keep(state.filesOpenByTabId),
            filesWidthByTabId: keep(state.filesWidthByTabId),
          };
        }),
    }),
    {
      name: "chat-panel",
      version: 1,
      migrate: (state) => state,
      partialize: (state) => ({ filesWidthByTabId: state.filesWidthByTabId }),
    },
  ),
);
