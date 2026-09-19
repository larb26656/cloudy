import { Bot, ChevronDown, Search, Star } from "lucide-react";
import { useState } from "react";
import { Input } from "@repo/ui/components/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";

export interface ModelSelectorModel {
  providerID: string;
  modelID: string;
  name: string;
  description?: string;
}

export interface ModelSelectorGroup<T extends ModelSelectorModel> {
  key: string;
  label: React.ReactNode;
  models: T[];
}

interface ModelSelectorProps<T extends ModelSelectorModel> {
  models?: T[];
  groups?: ModelSelectorGroup<T>[];
  value: T | null;
  favorites: T[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isMobile?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onChange: (model: T | null) => void;
  onToggleFavorite: (model: T) => void;
}

export function ModelSelector<T extends ModelSelectorModel>({
  models,
  groups,
  value,
  favorites,
  open,
  onOpenChange,
  isMobile = false,
  isLoading = false,
  error = null,
  onChange,
  onToggleFavorite,
}: ModelSelectorProps<T>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const modelGroups = groups ?? [
    { key: "models", label: null, models: models ?? [] },
  ];
  const allModels = modelGroups.flatMap((group) => group.models);
  const favoriteKeys = new Set(
    favorites.map((model) => `${model.providerID}::${model.modelID}`),
  );
  const favoriteModels = favorites.filter((favorite) =>
    allModels.some(
      (model) =>
        model.providerID === favorite.providerID &&
        model.modelID === favorite.modelID,
    ),
  );
  const filteredGroups = modelGroups
    .map((group) => ({
      ...group,
      models: search
        ? group.models.filter((model) =>
            `${model.name} ${model.modelID}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
        : group.models,
    }))
    .filter((group) => group.models.length > 0);

  function handleChange(model: T | null) {
    onChange(model);
    setIsOpen(false);
    setSearch("");
  }

  const trigger = (
    <span className="inline-flex items-center justify-center gap-1">
      <Bot className="size-4 shrink-0" />
      <span className="max-w-48 truncate">{value?.name ?? "Default"}</span>
      <ChevronDown className="size-3.5 shrink-0" />
    </span>
  );

  const searchInput = (
    <div className="p-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search models..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => event.stopPropagation()}
          className="pl-8"
        />
      </div>
    </div>
  );

  const options = (
    <>
      {isLoading ? (
        <LoadingState size="compact" title={null} />
      ) : error ? (
        <ErrorState size="compact" bare message={error} />
      ) : filteredGroups.length === 0 ? (
        <EmptyState size="compact" title="No models found" />
      ) : (
        <>
          {!search && favoriteModels.length > 0 && (
            <ModelGroup
              label={
                <>
                  <Star
                    className="size-3.5 text-yellow-500"
                    fill="currentColor"
                  />
                  Favorites
                </>
              }
              models={favoriteModels}
              favoriteKeys={favoriteKeys}
              isMobile={isMobile}
              onSelect={handleChange}
              onToggleFavorite={onToggleFavorite}
            />
          )}
          {filteredGroups.map((group) => (
            <ModelGroup
              key={group.key}
              label={group.label}
              models={group.models}
              favoriteKeys={favoriteKeys}
              isMobile={isMobile}
              onSelect={handleChange}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </>
      )}
    </>
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
            {!search && (
              <button
                type="button"
                onClick={() => handleChange(null)}
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
        {!search && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleChange(null)}>
              Use Default Model
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ModelGroup<T extends ModelSelectorModel>({
  label,
  models,
  favoriteKeys,
  isMobile,
  onSelect,
  onToggleFavorite,
}: {
  label: React.ReactNode;
  models: T[];
  favoriteKeys: Set<string>;
  isMobile: boolean;
  onSelect: (model: T) => void;
  onToggleFavorite: (model: T) => void;
}) {
  return isMobile ? (
    <section>
      {label && (
        <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          {label}
        </div>
      )}
      {models.map((model) => (
        <ModelRow
          key={`${model.providerID}-${model.modelID}`}
          model={model}
          isFavorite={favoriteKeys.has(`${model.providerID}::${model.modelID}`)}
          isMobile
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </section>
  ) : (
    <DropdownMenuGroup>
      {label && <DropdownMenuLabel>{label}</DropdownMenuLabel>}
      {models.map((model) => (
        <ModelRow
          key={`${model.providerID}-${model.modelID}`}
          model={model}
          isFavorite={favoriteKeys.has(`${model.providerID}::${model.modelID}`)}
          isMobile={false}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </DropdownMenuGroup>
  );
}

function ModelRow<T extends ModelSelectorModel>({
  model,
  isFavorite,
  isMobile,
  onSelect,
  onToggleFavorite,
}: {
  model: T;
  isFavorite: boolean;
  isMobile: boolean;
  onSelect: (model: T) => void;
  onToggleFavorite: (model: T) => void;
}) {
  if (isMobile) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <button
          type="button"
          onClick={() => onSelect(model)}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left text-sm"
        >
          <span className="min-w-0 truncate">{model.name}</span>
          {model.description && (
            <span className="truncate text-xs text-muted-foreground">
              {model.description}
            </span>
          )}
        </button>
        <FavoriteButton
          model={model}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
    );
  }

  return (
    <DropdownMenuItem
      onClick={() => onSelect(model)}
      className="flex items-center justify-between gap-2"
    >
      <div className="min-w-0">
        <div className="truncate">{model.name}</div>
        {model.description && (
          <div className="truncate text-xs text-muted-foreground">
            {model.description}
          </div>
        )}
      </div>
      <FavoriteButton
        model={model}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />
    </DropdownMenuItem>
  );
}

function FavoriteButton<T extends ModelSelectorModel>({
  model,
  isFavorite,
  onToggleFavorite,
}: {
  model: T;
  isFavorite: boolean;
  onToggleFavorite: (model: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggleFavorite(model);
      }}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorite}
      className={
        isFavorite
          ? "shrink-0 rounded-sm p-1 text-yellow-500 hover:text-yellow-600"
          : "shrink-0 rounded-sm p-1 text-muted-foreground/60 hover:text-muted-foreground"
      }
    >
      <Star className="size-3.5" fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );
}
