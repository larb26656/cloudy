import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ModelSelector,
  type ModelSelectorModel,
} from "@repo/ui/components/model-selector";
import { createClient, getErrorMessage } from "../lib/opencode/client";

const FAVORITES_STORAGE_KEY = "extension-favorite-models";

export type ExtensionModel = ModelSelectorModel;

interface ExtensionModelSelectorProps {
  directory: string;
  value: ExtensionModel | null;
  onChange: (model: ExtensionModel | null) => void;
}

async function loadModels(directory: string): Promise<ExtensionModel[]> {
  const result = await createClient(directory).config.providers();
  if (result.error) throw new Error(getErrorMessage(result.error));

  return result.data.providers.flatMap((provider) =>
    Object.values(provider.models)
      .filter((model) => model.status === "active")
      .map((model) => ({
        providerID: provider.id,
        modelID: model.id,
        name: model.name,
        description: `${model.family ?? ""} • ${model.limit.context.toLocaleString()} context`,
      })),
  );
}

export function ExtensionModelSelector({
  directory,
  value,
  onChange,
}: ExtensionModelSelectorProps) {
  const [favorites, setFavorites] = useState<ExtensionModel[]>([]);
  const {
    data: models = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["extension-models", directory],
    queryFn: () => loadModels(directory),
    staleTime: 60_000,
  });

  useEffect(() => {
    let cancelled = false;
    void browser.storage.local.get(FAVORITES_STORAGE_KEY).then((stored) => {
      const saved = stored[FAVORITES_STORAGE_KEY];
      if (!cancelled && Array.isArray(saved)) {
        setFavorites(saved as ExtensionModel[]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleFavorite(model: ExtensionModel) {
    const key = `${model.providerID}::${model.modelID}`;
    const nextFavorites = favorites.some(
      (favorite) => `${favorite.providerID}::${favorite.modelID}` === key,
    )
      ? favorites.filter(
          (favorite) => `${favorite.providerID}::${favorite.modelID}` !== key,
        )
      : [model, ...favorites];
    setFavorites(nextFavorites);
    void browser.storage.local.set({
      [FAVORITES_STORAGE_KEY]: nextFavorites,
    });
  }

  return (
    <ModelSelector
      models={models}
      value={value}
      favorites={favorites}
      isLoading={isLoading}
      error={error ? getErrorMessage(error) : null}
      onChange={onChange}
      onToggleFavorite={toggleFavorite}
    />
  );
}
