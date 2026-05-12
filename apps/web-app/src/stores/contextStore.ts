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

  addContext: (context) =>
    set((state) => {
      const existing = state.contexts.findIndex(
        (c) => c.type === context.type && !context.replace,
      );
      if (existing >= 0) {
        const updated = [...state.contexts];
        updated[existing] = context;
        return { contexts: updated };
      }
      return { contexts: [...state.contexts, context] };
    }),

  removeContext: (id) =>
    set((state) => ({
      contexts: state.contexts.filter((c) => c.id !== id),
    })),

  clearContexts: () => set({ contexts: [] }),
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
    };
  }
}
