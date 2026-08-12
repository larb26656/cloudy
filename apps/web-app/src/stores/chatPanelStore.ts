import { create } from "zustand";

interface ChatPanelState {
  filesOpenByTabId: Record<string, boolean>;
  toggleFiles: (tabId: string) => void;
  setFilesOpen: (tabId: string, open: boolean) => void;
}

export const useChatPanelStore = create<ChatPanelState>((set) => ({
  filesOpenByTabId: {},
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
}));
