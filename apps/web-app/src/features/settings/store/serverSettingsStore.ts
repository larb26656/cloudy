import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ServerMode = "local" | "remote";

export type ServerSettings = {
  mode: ServerMode;
  local: {
    host: string;
    port: number;
  };
  remote: {
    endpoint: string;
  };
};

type ServerSettingsStore = ServerSettings & {
  setMode: (mode: ServerMode) => void;
  setLocalConfig: (config: Partial<ServerSettings["local"]>) => void;
  setRemoteEndpoint: (endpoint: string) => void;
};

const defaultLocalConfig = {
  host: "localhost",
  port: 3000,
};

export const useServerSettingsStore = create<ServerSettingsStore>()(
  persist(
    (set) => ({
      mode: "local",
      local: defaultLocalConfig,
      remote: {
        endpoint: "",
      },

      setMode: (mode) => set({ mode }),
      setLocalConfig: (config) =>
        set((state) => ({
          local: { ...state.local, ...config },
        })),
      setRemoteEndpoint: (endpoint) =>
        set((state) => ({
          remote: { ...state.remote, endpoint },
        })),
    }),
    {
      name: "cloudy-server-settings",
    }
  )
);
