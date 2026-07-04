import { create } from "zustand";
import { persist } from "zustand/middleware";

type SettingsState = {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  language: string;
};

type SettingsActions = {
  setTheme: (theme: SettingsState["theme"]) => void;
  setFontSize: (fontSize: SettingsState["fontSize"]) => void;
  setLanguage: (language: SettingsState["language"]) => void;
};

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "system",
      fontSize: "medium",
      language: "en",

      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "settings-storage",
    }
  )
);
