import { create } from "zustand";
import type { ModelSelectorModel } from "@repo/ui/components/model-selector";

const FAVORITES_STORAGE_KEY = "extension-favorite-models";

interface FavoriteModelsStore {
  favorites: ModelSelectorModel[];
  hydrate: () => Promise<void>;
  toggleFavorite: (model: ModelSelectorModel) => void;
}

export const useFavoriteModelsStore = create<FavoriteModelsStore>(
  (set, get) => ({
    favorites: [],

    hydrate: async () => {
      const stored = await browser.storage.local.get(FAVORITES_STORAGE_KEY);
      const saved = stored[FAVORITES_STORAGE_KEY];
      set({
        favorites: Array.isArray(saved) ? (saved as ModelSelectorModel[]) : [],
      });
    },

    toggleFavorite: (model) => {
      const key = `${model.providerID}::${model.modelID}`;
      const favorites = get().favorites;
      const nextFavorites = favorites.some(
        (favorite) => `${favorite.providerID}::${favorite.modelID}` === key,
      )
        ? favorites.filter(
            (favorite) => `${favorite.providerID}::${favorite.modelID}` !== key,
          )
        : [model, ...favorites];

      set({ favorites: nextFavorites });
      void browser.storage.local.set({
        [FAVORITES_STORAGE_KEY]: nextFavorites,
      });
    },
  }),
);
