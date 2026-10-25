import { create } from "zustand";
import type { AppPage } from "@/features/home/pages";

export type HomeSection = "home" | AppPage;

interface HomeSectionStore {
  activeSection: HomeSection;
  setActiveSection: (section: HomeSection) => void;
}

export const useHomeSectionStore = create<HomeSectionStore>((set) => ({
  activeSection: "home",
  setActiveSection: (activeSection) => set({ activeSection }),
}));
