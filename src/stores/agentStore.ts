import { create } from "zustand";
import { persist } from "zustand/middleware";

type AgentStoreState = {
  selectedAgent: string | null;
}

type AgentStoreActions = {
  setSelectedAgent: (agent: string | null) => void;
}

type AgentStore = AgentStoreState & AgentStoreActions

export const useAgentStore = create<AgentStore>()(persist(
  (set) => ({
    selectedAgent: null,

    setSelectedAgent: (agent: string | null) => {
      set({ selectedAgent: agent });
    },
  }),
  {
    name: 'agent-storage',
  }
))
