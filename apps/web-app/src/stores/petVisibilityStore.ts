import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PetVisibilityState {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const usePetVisibilityStore = create<PetVisibilityState>()(
  persist(
    (set) => ({
      visible: true,
      setVisible: (visible) => set({ visible }),
    }),
    {
      name: "pet-visibility",
      version: 1,
      migrate: (persistedState) => persistedState as PetVisibilityState,
    },
  ),
);
