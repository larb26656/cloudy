import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ModelSelectorModel } from "@repo/ui/components/model-selector";
import { extensionStorage } from "../lib/storage";

interface FavoriteModelsStore {
  favorites: ModelSelectorModel[];
  toggleFavorite: (model: ModelSelectorModel) => void;
}

export const useFavoriteModelsStore = create<FavoriteModelsStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      toggleFavorite: (model) => {
        const key = `${model.providerID}::${model.modelID}`;
        const favorites = get().favorites;
        const nextFavorites = favorites.some(
          (favorite) => `${favorite.providerID}::${favorite.modelID}` === key,
        )
          ? favorites.filter(
              (favorite) =>
                `${favorite.providerID}::${favorite.modelID}` !== key,
            )
          : [model, ...favorites];

        set({ favorites: nextFavorites });
      },
    }),
    {
      name: "extension-favorite-models",
      storage: createJSONStorage(() => extensionStorage),
      version: 1,
      migrate: (persistedState) => persistedState,
    },
  ),
);
