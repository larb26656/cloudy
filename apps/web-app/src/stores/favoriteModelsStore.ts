import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelConfig } from "@/types";

type FavoriteModelsStore = {
  favorites: ModelConfig[];
  isFavorite: (providerID: string, modelID: string) => boolean;
  toggleFavorite: (model: ModelConfig) => void;
  removeFavorite: (providerID: string, modelID: string) => void;
};

const identity = <T>(value: T): T => value;

export const useFavoriteModelsStore = create<FavoriteModelsStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      isFavorite: (providerID, modelID) =>
        get().favorites.some(
          (m) => m.providerID === providerID && m.modelID === modelID,
        ),

      toggleFavorite: (model) =>
        set((state) => {
          const exists = state.favorites.some(
            (m) =>
              m.providerID === model.providerID && m.modelID === model.modelID,
          );
          if (exists) {
            return {
              favorites: state.favorites.filter(
                (m) =>
                  !(
                    m.providerID === model.providerID &&
                    m.modelID === model.modelID
                  ),
              ),
            };
          }
          return { favorites: [model, ...state.favorites] };
        }),

      removeFavorite: (providerID, modelID) =>
        set((state) => ({
          favorites: state.favorites.filter(
            (m) => !(m.providerID === providerID && m.modelID === modelID),
          ),
        })),
    }),
    {
      name: "favorite-models",
      version: 1,
      migrate: identity,
    },
  ),
);
