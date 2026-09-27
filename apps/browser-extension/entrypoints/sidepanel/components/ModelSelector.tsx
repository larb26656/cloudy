import { useQuery } from "@tanstack/react-query";
import {
  ModelSelector as PureModelSelector,
  type ModelSelectorModel,
} from "@repo/ui/components/model-selector";
import { listProviderModels } from "../lib/cloudy/provider";
import { useFavoriteModelsStore } from "../stores/favoriteModelsStore";

export type Model = ModelSelectorModel;

interface ModelSelectorProps {
  directory: string;
  value: Model | null;
  onChange: (model: Model | null) => void;
}

async function loadModels(directory: string): Promise<Model[]> {
  void directory;
  return (await listProviderModels()).map((model) => ({
    providerID: model.providerId,
    modelID: model.modelId,
    name: model.name,
    description: model.description,
  }));
}

export function ModelSelector({
  directory,
  value,
  onChange,
}: ModelSelectorProps) {
  const favorites = useFavoriteModelsStore((state) => state.favorites);
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
      error={
        error instanceof Error ? error.message : error ? String(error) : null
      }
      onChange={onChange}
      onToggleFavorite={toggleFavorite}
    />
  );
}
