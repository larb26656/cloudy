// components/chat/ModelSelector.tsx
import { useState, useEffect, useRef } from "react";
import {
  Bot,
  Cloud,
  Sparkles,
  Cpu,
  Loader2,
  ChevronDown,
  Search,
} from "lucide-react";
import { useModels } from "../../hooks";
import type { ModelConfig } from "../../types";
import { Button } from "@/components/ui/button";
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
import { useModelStore } from "@/stores/modelStore";

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

export function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { providers, isLoading, error } = useModels();
  const { selectedModel, setSelectedModel } = useModelStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "m") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    if (!selectedModel) return "Default";
    return selectedModel.name;
  };

  const handleSelectModel = (model: ModelConfig | null) => {
    setSelectedModel(model);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-auto py-1.5 px-3">
          <Bot className="size-4" />
          <span className="max-w-[120px] truncate">{getDisplayName()}</span>
          <ChevronDown className="size-3.5" />
        </Button>
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
              className="pl-8"
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-destructive text-center">
              {error}
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No models found
            </div>
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
