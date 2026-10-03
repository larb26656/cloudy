import { create } from "zustand";
import { persist } from "zustand/middleware";

type DefaultProviderStore = {
  defaultProviderId: string;
  setDefaultProvider: (providerId: string) => void;
};

export const useDefaultProviderStore = create<DefaultProviderStore>()(
  persist(
    (set) => ({
      defaultProviderId: "opencode",
      setDefaultProvider: (providerId) =>
        set({ defaultProviderId: providerId }),
    }),
    {
      name: "default-provider",
      version: 1,
      migrate: (persisted) => persisted as DefaultProviderStore,
    },
  ),
);
