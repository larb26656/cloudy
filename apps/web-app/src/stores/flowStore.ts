import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Node, Edge, Viewport } from "@xyflow/react";
import { toModelInfo } from "@/lib/models";

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
  const state = persistedState as PersistedFlowState | undefined;
  if (!state?.flows) return persistedState;
  if (version >= 3) return persistedState;

  let flows = state.flows;

  // v1 -> v2: rename the "bot" desk node type to "bot-chat".
  if (version < 2) {
    flows = Object.fromEntries(
      Object.entries(flows).map(([id, flow]) => [
        id,
        {
          ...flow,
          nodes: flow.nodes.map((node) =>
            node.type === "bot" ? { ...node, type: "bot-chat" } : node,
          ),
        },
      ]),
    );
  }

  // v2 -> v3: persisted chat/bot-chat node model selections moved from the
  // legacy `providerID`/`modelID` shape to the canonical `ModelInfo`
  // contract (`providerId`/`modelId`). Entries without a usable identity
  // fall back to null (the global default).
  if (version < 3) {
    flows = Object.fromEntries(
      Object.entries(flows).map(([id, flow]) => [
        id,
        {
          ...flow,
          nodes: flow.nodes.map((node) =>
            node.type === "chat" || node.type === "bot-chat"
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    model: toModelInfo(node.data?.model),
                  },
                }
              : node,
          ),
        },
      ]),
    );
  }

  return { ...state, flows };
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
      version: 3,
      migrate: migrateBotNodeType,
    },
  ),
);
