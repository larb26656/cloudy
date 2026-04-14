import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getErrorMessage } from "@/lib/opencode";
import type { Agent } from "@/types";
import type { OpencodeClient } from "@opencode-ai/sdk/v2";

export type AgentStoreState = {
  selectedAgent: string | null;
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
}

export type AgentStoreActions = {
  setSelectedAgent: (agent: string | null) => void;
  fetchAgents: () => Promise<void>;
}

export type AgentStore = AgentStoreState & AgentStoreActions

export const createAgentStore = (oc: OpencodeClient) => create<AgentStore>()(
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
          const result = await oc.app.agents();
          if (result.error) {
            throw new Error(getErrorMessage(result.error as Parameters<typeof getErrorMessage>[0]));
          }
          const data = result.data;
          if (Array.isArray(data)) {
            const mappedAgents: Agent[] = data
              .filter((a) => !a.hidden)
              .map((a) => ({
                name: a.name,
                description: a.description,
                mode: a.mode,
                native: a.native,
                hidden: a.hidden,
              }));
            set({ agents: mappedAgents, isLoading: false });
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
