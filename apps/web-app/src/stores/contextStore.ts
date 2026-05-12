import { create } from "zustand";
import type { ContextItem, ContextUpdateEvent } from "@/types/context";

type ContextStoreState = {
  contexts: ContextItem[];
};

type ContextStoreActions = {
  setContexts: (contexts: ContextItem[]) => void;
  addContext: (context: ContextItem) => void;
  removeContext: (id: string) => void;
  clearContexts: () => void;
};

type ContextStore = ContextStoreState & ContextStoreActions;

export const useContextStore = create<ContextStore>()((set) => ({
  contexts: [],

  setContexts: (contexts) => set({ contexts }),

  addContext: (context) => {
    window.electronAPI?.context.addContext({
      type: context.type,
      data: context.data,
      replace: context.replace,

    });
  },

  removeContext: (id) => {
    window.electronAPI?.context.removeContext(id);
  },

  clearContexts: () => {
    window.electronAPI?.context.clearContexts();
  },
}));

  declare global {
  interface Window {
    electronAPI?: {
      context: {
        addContext: (options: {
          type: string;
          data: unknown;
          replace?: boolean;
        }) => Promise<{ status: "added" | "replaced"; id: string }>;
        removeContext: (id: string) => Promise<boolean>;
        clearContexts: () => Promise<boolean>;
        listContexts: () => Promise<ContextItem[]>;
        onContextUpdate: (
          callback: (event: ContextUpdateEvent) => void,
        ) => () => void;
      };
      server: {
        start: (config: {
          host?: string;
          port?: number;
          dataDir?: string;
        }) => Promise<{
          status?: { running: boolean; url?: string };
          error?: string;
        }>;
        stop: () => Promise<{
          status?: { running: boolean; url?: string };
          error?: string;
        }>;
        status: () => Promise<{
          status: { running: boolean; url?: string };
        }>;
      };
    };
  }
}
