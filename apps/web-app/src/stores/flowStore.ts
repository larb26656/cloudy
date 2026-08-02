import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Node, Edge, Viewport } from "@xyflow/react";

export interface FlowData {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
}

interface FlowState {
  flows: Record<string, FlowData>;
  saveFlow: (tabId: string, flow: FlowData) => void;
  getFlow: (tabId: string) => FlowData | null;
  deleteFlow: (tabId: string) => void;
}

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      flows: {},
      saveFlow: (tabId, flow) => {
        set((state) => ({
          flows: { ...state.flows, [`desk-${tabId}`]: flow },
        }));
      },
      getFlow: (tabId) => get().flows[`desk-${tabId}`] ?? null,
      deleteFlow: (tabId) => {
        set((state) => {
          const flows = { ...state.flows };
          delete flows[`desk-${tabId}`];
          return { flows };
        });
      },
    }),
    {
      name: "flow-storage",
      version: 1,
      migrate: (persistedState) => persistedState,
    },
  ),
);
