import { create } from "zustand";
import { persist } from "zustand/middleware";

type DefaultAgentStore = {
  defaultAgent: string | null;
  setDefaultAgent: (agent: string | null) => void;
};

export const useDefaultAgentStore = create<DefaultAgentStore>()(
  persist(
    (set) => ({
      defaultAgent: null,
      setDefaultAgent: (agent) => set({ defaultAgent: agent }),
    }),
    { name: "default-agent" }
  )
);
