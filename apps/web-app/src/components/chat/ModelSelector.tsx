import { Bot, Cloud, Cpu, Sparkles } from "lucide-react";
import { useState } from "react";
import type {
  ModelSelectorGroup,
  ModelSelectorModel,
} from "@repo/ui/components/model-selector";
import { ModelSelector as PureModelSelector } from "@repo/ui/components/model-selector";
import type { ModelInfo } from "@repo/contracts";
import { useModels } from "@/hooks/queries/useModels";
import { useFavoriteModelsStore } from "@/stores/favoriteModelsStore";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useChatContext } from "./ChatProvider";

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
  providerId?: string;
  value?: ModelInfo | null;
  onChange?: (model: ModelInfo | null) => void;
  triggerClassName?: string;
}

type SelectorModel = ModelInfo & ModelSelectorModel;

function toSelectorModel(model: ModelInfo): SelectorModel {
  return {
    ...model,
    contextLength: model.capabilities?.maxInputTokens,
    providerID: model.providerId,
    modelID: model.modelId,
  };
}

function fromSelectorModel(model: SelectorModel): ModelInfo {
  return {
    providerId: model.providerId,
    modelId: model.modelId,
    name: model.name,
    description: model.description,
    capabilities: model.capabilities,
    variants: model.variants,
    variantId: model.variantId,
    metadata: model.metadata,
  };
}

export function ModelSelector({
  open,
  onOpenChange,
  providerId: providerIdProp,
  value: valueProp,
  onChange,
  triggerClassName,
}: ModelSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const chat = useChatContext();
  const providerId = providerIdProp ?? chat?.providerId ?? "opencode";
  const effectiveModel =
    valueProp === undefined ? chat?.effectiveModel : valueProp;
  const setModel = onChange ?? chat?.setModel;
  const { data: providers = [], isLoading, error } = useModels(providerId);
  const favorites = useFavoriteModelsStore((state) => state.favorites);
  const toggleFavorite = useFavoriteModelsStore(
    (state) => state.toggleFavorite,
  );
  const { isMobile } = useDeviceType();

  const modelsByProvider = new Map<string, SelectorModel[]>();
  for (const provider of providers) {
    for (const model of provider.models ?? []) {
      const selectorModel = toSelectorModel(model);
      const models = modelsByProvider.get(model.providerId) ?? [];
      models.push(selectorModel);
      modelsByProvider.set(model.providerId, models);
    }
  }
  const groups: ModelSelectorGroup<SelectorModel>[] = Array.from(
    modelsByProvider,
    ([providerId, models]) => ({
      key: providerId,
      label: (
        <>
          {providerIcons[providerId] ?? <Bot className="size-4" />}
          {providerNames[providerId] ?? providerId}
        </>
      ),
      models,
    }),
  );
  const models = groups.flatMap((group) => group.models);
  const availableModelKeys = new Set(
    models.map((model) => `${model.providerId}::${model.modelId}`),
  );
  const liveFavorites = favorites
    .filter((model) =>
      availableModelKeys.has(`${model.providerId}::${model.modelId}`),
    )
    .map(toSelectorModel);

  return (
    <PureModelSelector
      groups={groups}
      value={effectiveModel ? toSelectorModel(effectiveModel) : null}
      favorites={liveFavorites}
      open={isOpen}
      onOpenChange={setIsOpen}
      isMobile={isMobile}
      isLoading={isLoading}
      error={error instanceof Error ? error.message : null}
      onChange={(model) => setModel?.(model ? fromSelectorModel(model) : null)}
      onToggleFavorite={(model) => toggleFavorite(fromSelectorModel(model))}
      triggerClassName={triggerClassName}
    />
  );
}
