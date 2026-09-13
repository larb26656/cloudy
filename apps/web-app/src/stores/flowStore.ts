import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Node, Edge, Viewport } from "@xyflow/react";

export interface FlowData {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
}

type PersistedFlowState = { flows?: Record<string, FlowData> };

export function migrateBotNodeType(
  persistedState: unknown,
  version: number,
): unknown {
  if (version >= 2) return persistedState;
  const state = persistedState as PersistedFlowState;
  if (!state.flows) return persistedState;
  return {
    ...state,
    flows: Object.fromEntries(
      Object.entries(state.flows).map(([id, flow]) => [
        id,
        {
          ...flow,
          nodes: flow.nodes.map((node) =>
            node.type === "bot" ? { ...node, type: "bot-chat" } : node,
          ),
        },
      ]),
    ),
  };
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
      version: 2,
      migrate: migrateBotNodeType,
    },
  ),
);
