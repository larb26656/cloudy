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
import { Input } from "@repo/ui/components/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { useModels } from "@/hooks/queries/useModels";
import { useFavoriteModelsStore } from "@/stores/favoriteModelsStore";
import { cn } from "@repo/ui/lib/utils";
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
  const { isMobile } = useDeviceType();

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
    const rowContent = (
      <>
        <div className="min-w-0 flex-1">
          <div className="truncate">{model.name}</div>
          {model.description && (
            <div className="truncate text-xs text-muted-foreground">
              {model.description}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          {model.supportsTools && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
              Tools
            </span>
          )}
          {model.supportsStreaming && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
              Stream
            </span>
          )}
        </div>
      </>
    );

    if (isMobile) {
      return (
        <div
          key={`${model.providerID}-${model.modelID}`}
          className="flex items-center gap-2 px-4 py-2"
        >
          <button
            type="button"
            onClick={() => handleSelectModel(model)}
            className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left text-sm"
          >
            {rowContent}
          </button>
          <button
            type="button"
            onClick={(e) => handleToggleFavorite(e, model)}
            aria-label={
              favorited ? "Remove from favorites" : "Add to favorites"
            }
            aria-pressed={favorited}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-sm p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
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
        </div>
      );
    }

    return (
      <DropdownMenuItem
        key={`${model.providerID}-${model.modelID}`}
        onClick={() => handleSelectModel(model)}
        className="flex items-center justify-between gap-2"
      >
        {rowContent}
        <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
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
        </div>
      </DropdownMenuItem>
    );
  };

  const renderGroup = (
    key: string,
    label: React.ReactNode,
    models: ModelConfig[],
  ) => {
    if (isMobile) {
      return (
        <section key={key}>
          <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            {label}
          </div>
          {models.map((model) => renderModelRow(model))}
        </section>
      );
    }

    return (
      <DropdownMenuGroup key={key}>
        <DropdownMenuLabel className="flex items-center gap-2">
          {label}
        </DropdownMenuLabel>
        {models.map((model) => renderModelRow(model))}
      </DropdownMenuGroup>
    );
  };

  const options = (
    <>
      {isLoading ? (
        <LoadingState size="compact" title={null} />
      ) : error ? (
        <ErrorState size="compact" bare message={(error as Error).message} />
      ) : filteredProviders.length === 0 ? (
        <EmptyState size="compact" title="No models found" />
      ) : (
        <>
          {showFavorites &&
            renderGroup(
              "favorites",
              <>
                <Star
                  className="size-3.5 text-yellow-500"
                  fill="currentColor"
                />
                Favorites
              </>,
              liveFavorites,
            )}
          {filteredProviders.map((provider) =>
            renderGroup(
              provider.id,
              <>
                {providerIcons[provider.id] || <Bot className="size-4" />}
                {providerNames[provider.id] || provider.name}
              </>,
              provider.models,
            ),
          )}
        </>
      )}
    </>
  );

  const searchInput = (
    <div className="p-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
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
  );

  const trigger = (
    <span className="inline-flex items-center justify-center gap-1">
      <Bot className="size-4" />
      <span className="max-w-[120px] truncate">{getDisplayName()}</span>
      <ChevronDown className="size-3.5" />
    </span>
  );

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center gap-1"
        >
          {trigger}
        </button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[80dvh] rounded-t-xl p-0"
          >
            <SheetHeader>
              <SheetTitle>Select model</SheetTitle>
            </SheetHeader>
            {searchInput}
            <div className="min-h-0 flex-1 overflow-y-auto border-y py-1">
              {options}
            </div>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => handleSelectModel(null)}
                className="px-4 py-3 text-left text-sm font-medium hover:bg-muted"
              >
                Use Default Model
              </button>
            )}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1">
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {searchInput}
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">{options}</div>
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
