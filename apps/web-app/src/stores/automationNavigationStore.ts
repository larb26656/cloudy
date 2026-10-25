import { create } from "zustand";

type AutomationReturnTarget = { automationId: string; runId: string };

interface AutomationNavigationState {
  returnTarget: AutomationReturnTarget | null;
  setReturnTarget: (target: AutomationReturnTarget) => void;
  consumeReturnTarget: () => AutomationReturnTarget | null;
}

export const useAutomationNavigationStore = create<AutomationNavigationState>(
  (set, get) => ({
    returnTarget: null,
    setReturnTarget: (returnTarget) => set({ returnTarget }),
    consumeReturnTarget: () => {
      const target = get().returnTarget;
      set({ returnTarget: null });
      return target;
    },
  }),
);
