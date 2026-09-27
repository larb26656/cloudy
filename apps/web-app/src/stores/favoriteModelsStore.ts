import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelInfo } from "@repo/contracts";
import { toModelInfo } from "@/lib/models";

type FavoriteModelsStore = {
  favorites: ModelInfo[];
  isFavorite: (providerId: string, modelId: string) => boolean;
  toggleFavorite: (model: ModelInfo) => void;
  removeFavorite: (providerId: string, modelId: string) => void;
};

export const useFavoriteModelsStore = create<FavoriteModelsStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      isFavorite: (providerId, modelId) =>
        get().favorites.some(
          (m) => m.providerId === providerId && m.modelId === modelId,
        ),

      toggleFavorite: (model) =>
        set((state) => {
          const exists = state.favorites.some(
            (m) =>
              m.providerId === model.providerId && m.modelId === model.modelId,
          );
          if (exists) {
            return {
              favorites: state.favorites.filter(
                (m) =>
                  !(
                    m.providerId === model.providerId &&
                    m.modelId === model.modelId
                  ),
              ),
            };
          }
          return { favorites: [model, ...state.favorites] };
        }),

      removeFavorite: (providerId, modelId) =>
        set((state) => ({
          favorites: state.favorites.filter(
            (m) => !(m.providerId === providerId && m.modelId === modelId),
          ),
        })),
    }),
    {
      name: "favorite-models",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as { favorites?: unknown[] } | null;
        const favorites = (state?.favorites ?? [])
          .map(toModelInfo)
          .filter((m): m is ModelInfo => m !== null);
        return { favorites } as unknown as FavoriteModelsStore;
      },
    },
  ),
);
