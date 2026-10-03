import { create } from "zustand";
import { persist } from "zustand/middleware";

type DefaultAgentStore = {
  defaultAgents: Record<string, string | null>;
  setDefaultAgent: (providerId: string, agent: string | null) => void;
};

export const useDefaultAgentStore = create<DefaultAgentStore>()(
  persist(
    (set) => ({
      defaultAgents: {},
      setDefaultAgent: (providerId, agent) =>
        set((state) => ({
          defaultAgents: { ...state.defaultAgents, [providerId]: agent },
        })),
    }),
    {
      name: "default-agent",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as { defaultAgent?: unknown } | null;
        return {
          defaultAgents:
            typeof state?.defaultAgent === "string"
              ? { opencode: state.defaultAgent }
              : {},
        } as DefaultAgentStore;
      },
    },
  ),
);
