import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getErrorMessage, getOc, type SdkError } from "../lib";
import type { Agent } from "@opencode-ai/sdk/v2";

type AgentStoreState = {
  selectedAgent: string | null;
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
}

type AgentStoreActions = {
  setSelectedAgent: (agent: string | null) => void;
  fetchAgents: () => Promise<void>;
}

export type AgentStore = AgentStoreState & AgentStoreActions;

export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      selectedAgent: null,
      agents: [],
      isLoading: false,
      error: null,

      setSelectedAgent: (agent: string | null) => {
        set({ selectedAgent: agent });
      },

      fetchAgents: async () => {
        set({ isLoading: true, error: null });
        try {
          const oc = getOc();
          const result = await oc.app.agents();
          if (result.error) {
            throw new Error(getErrorMessage(result.error as SdkError));
          }
          const data = result.data;
          if (Array.isArray(data)) {
            const agents = data.filter((a) => !a.hidden);
            set({ agents, isLoading: false });
          } else {
            set({ agents: [], isLoading: false });
          }
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false, agents: [] });
        }
      },
    }),
    {
      name: "agent-storage",
      partialize: (state) => ({ selectedAgent: state.selectedAgent }),
    }
  )
);
