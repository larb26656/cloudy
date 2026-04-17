import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface OnboardingStore {
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (value) => set({ hasCompletedOnboarding: value }),
    }),
    {
      name: `cloudy-onboarding`,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);