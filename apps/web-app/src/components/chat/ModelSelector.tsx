import { useState, useEffect, useRef } from "react";
import { Bot, Cloud, Sparkles, Cpu, ChevronDown, Search } from "lucide-react";
import type { ModelConfig, ModelProvider } from "@/types";
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

const FALLBACK_PROVIDERS: ModelProvider[] = [
  {
    id: "offline",
    name: "Offline (no backend)",
    models: [
      {
        providerID: "offline",
        modelID: "offline",
        name: "Offline",
        description: "Cannot reach OC backend",
        maxTokens: 0,
        supportsStreaming: false,
        supportsTools: false,
      },
    ],
  },
];

export function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { effectiveModel, setModel } = useChat();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, error } = useModels();
  const providers = data ?? FALLBACK_PROVIDERS;

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

  const getDisplayName = () => {
    if (!effectiveModel) return "Default";
    return effectiveModel.name;
  };

  const handleSelectModel = (model: ModelConfig | null) => {
    setModel(model);
    setIsOpen(false);
    setSearchQuery("");
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
            filteredProviders.map((provider) => (
              <DropdownMenuGroup key={provider.id}>
                <DropdownMenuLabel className="flex items-center gap-2">
                  {providerIcons[provider.id] || <Bot className="size-4" />}
                  {providerNames[provider.id] || provider.name}
                </DropdownMenuLabel>
                {provider.models.map((model) => (
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
                ))}
              </DropdownMenuGroup>
            ))
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
