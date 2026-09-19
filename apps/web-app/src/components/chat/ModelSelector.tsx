import { Bot, Cloud, Cpu, Sparkles } from "lucide-react";
import { useState } from "react";
import type {
  ModelSelectorGroup,
  ModelSelectorModel,
} from "@repo/ui/components/model-selector";
import { ModelSelector as PureModelSelector } from "@repo/ui/components/model-selector";
import type { ModelConfig } from "@/types";
import { useModels } from "@/hooks/queries/useModels";
import { useFavoriteModelsStore } from "@/stores/favoriteModelsStore";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useChat } from "./ChatProvider";

const providerIcons: Record<string, React.ReactNode> = {
  openai: <Cloud className="size-4" />,
  anthropic: <Sparkles className="size-4" />,
  local: <Cpu className="size-4" />,
};

const providerNames: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  local: "Local",
};

interface ModelSelectorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type SelectorModel = ModelConfig & ModelSelectorModel;

export function ModelSelector({ open, onOpenChange }: ModelSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const { effectiveModel, setModel } = useChat();
  const { data: providers = [], isLoading, error } = useModels();
  const favorites = useFavoriteModelsStore((state) => state.favorites);
  const toggleFavorite = useFavoriteModelsStore(
    (state) => state.toggleFavorite,
  );
  const { isMobile } = useDeviceType();

  const groups: ModelSelectorGroup<SelectorModel>[] = providers.map(
    (provider) => ({
      key: provider.id,
      label: (
        <>
          {providerIcons[provider.id] ?? <Bot className="size-4" />}
          {providerNames[provider.id] ?? provider.name}
        </>
      ),
      models: provider.models,
    }),
  );
  const models = groups.flatMap((group) => group.models);
  const availableModelKeys = new Set(
    models.map((model) => `${model.providerID}::${model.modelID}`),
  );
  const liveFavorites = favorites.filter((model) =>
    availableModelKeys.has(`${model.providerID}::${model.modelID}`),
  );

  return (
    <PureModelSelector
      groups={groups}
      value={effectiveModel}
      favorites={liveFavorites}
      open={isOpen}
      onOpenChange={setIsOpen}
      isMobile={isMobile}
      isLoading={isLoading}
      error={error instanceof Error ? error.message : null}
      onChange={setModel}
      onToggleFavorite={toggleFavorite}
    />
  );
}
