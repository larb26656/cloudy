import { useState, useEffect, useRef } from "react";
import {
  Bot,
  Cloud,
  Sparkles,
  Cpu,
  ChevronDown,
  Search,
  Star,
} from "lucide-react";
import type { ModelConfig } from "@/types";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useModels } from "@/hooks/queries/useModels";
import { useFavoriteModelsStore } from "@/stores/favoriteModelsStore";
import { cn } from "@/lib/utils";
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

export function ModelSelector({ open, onOpenChange }: ModelSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const [searchQuery, setSearchQuery] = useState("");
  const { effectiveModel, setModel } = useChat();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, error } = useModels();
  const providers = data || [];
  const favorites = useFavoriteModelsStore((s) => s.favorites);
  const toggleFavorite = useFavoriteModelsStore((s) => s.toggleFavorite);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const filteredProviders = searchQuery
    ? providers
        .map((p) => ({
          ...p,
          models: p.models.filter(
            (m) =>
              m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.modelID.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        }))
        .filter((p) => p.models.length > 0)
    : providers;

  const availableModelKeys = new Set(
    providers.flatMap((p) =>
      p.models.map((m) => `${m.providerID}::${m.modelID}`),
    ),
  );

  const liveFavorites = favorites.filter((m) =>
    availableModelKeys.has(`${m.providerID}::${m.modelID}`),
  );

  const showFavorites = !searchQuery && liveFavorites.length > 0;

  const getDisplayName = () => {
    if (!effectiveModel) return "Default";
    return effectiveModel.name;
  };

  const handleSelectModel = (model: ModelConfig | null) => {
    setModel(model);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleToggleFavorite = (
    e: React.MouseEvent<HTMLButtonElement>,
    model: ModelConfig,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(model);
  };

  const renderModelRow = (model: ModelConfig) => {
    const favorited = favorites.some(
      (f) => f.providerID === model.providerID && f.modelID === model.modelID,
    );
    return (
      <DropdownMenuItem
        key={`${model.providerID}-${model.modelID}`}
        onClick={() => handleSelectModel(model)}
        className="flex items-center justify-between gap-2"
      >
        <div className="flex-1 min-w-0">
          <div className="truncate">{model.name}</div>
          {model.description && (
            <div className="text-xs text-muted-foreground truncate">
              {model.description}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <button
            type="button"
            onClick={(e) => handleToggleFavorite(e, model)}
            aria-label={
              favorited ? "Remove from favorites" : "Add to favorites"
            }
            aria-pressed={favorited}
            className={cn(
              "inline-flex items-center justify-center rounded-sm p-1 -m-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              favorited
                ? "text-yellow-500 hover:text-yellow-600"
                : "text-muted-foreground/60 hover:text-muted-foreground",
            )}
          >
            <Star
              className="size-3.5"
              fill={favorited ? "currentColor" : "none"}
              strokeWidth={favorited ? 1.5 : 2}
            />
          </button>
          {model.supportsTools && (
            <span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
              Tools
            </span>
          )}
          {model.supportsStreaming && (
            <span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
              Stream
            </span>
          )}
        </div>
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1">
        <Bot className="size-4" />
        <span className="max-w-[120px] truncate">{getDisplayName()}</span>
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="pl-8"
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <LoadingState size="compact" title={null} />
          ) : error ? (
            <ErrorState
              size="compact"
              bare
              message={(error as Error).message}
            />
          ) : filteredProviders.length === 0 ? (
            <EmptyState size="compact" title="No models found" />
          ) : (
            <>
              {showFavorites && (
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Star
                      className="size-3.5 text-yellow-500"
                      fill="currentColor"
                    />
                    Favorites
                  </DropdownMenuLabel>
                  {liveFavorites.map((model) => renderModelRow(model))}
                </DropdownMenuGroup>
              )}
              {filteredProviders.map((provider) => (
                <DropdownMenuGroup key={provider.id}>
                  <DropdownMenuLabel className="flex items-center gap-2">
                    {providerIcons[provider.id] || <Bot className="size-4" />}
                    {providerNames[provider.id] || provider.name}
                  </DropdownMenuLabel>
                  {provider.models.map((model) => renderModelRow(model))}
                </DropdownMenuGroup>
              ))}
            </>
          )}
        </div>
        {!searchQuery && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleSelectModel(null)}>
              Use Default Model
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
