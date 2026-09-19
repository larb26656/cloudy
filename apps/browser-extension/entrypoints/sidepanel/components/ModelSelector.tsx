import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  ModelSelector as PureModelSelector,
  type ModelSelectorModel,
} from "@repo/ui/components/model-selector";
import { createClient, getErrorMessage } from "../lib/opencode/client";
import { useFavoriteModelsStore } from "../stores/favoriteModelsStore";

export type Model = ModelSelectorModel;

interface ModelSelectorProps {
  directory: string;
  value: Model | null;
  onChange: (model: Model | null) => void;
}

async function loadModels(directory: string): Promise<Model[]> {
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

export function ModelSelector({
  directory,
  value,
  onChange,
}: ModelSelectorProps) {
  const favorites = useFavoriteModelsStore((state) => state.favorites);
  const hydrateFavorites = useFavoriteModelsStore((state) => state.hydrate);
  const toggleFavorite = useFavoriteModelsStore(
    (state) => state.toggleFavorite,
  );
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
    void hydrateFavorites();
  }, [hydrateFavorites]);

  const availableModelKeys = new Set(
    models.map((model) => `${model.providerID}::${model.modelID}`),
  );
  const liveFavorites = favorites.filter((model) =>
    availableModelKeys.has(`${model.providerID}::${model.modelID}`),
  );

  return (
    <PureModelSelector
      models={models}
      value={value}
      favorites={liveFavorites}
      isLoading={isLoading}
      error={error ? getErrorMessage(error) : null}
      onChange={onChange}
      onToggleFavorite={toggleFavorite}
    />
  );
}
