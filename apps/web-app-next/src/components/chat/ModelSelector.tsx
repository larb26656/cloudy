import { useState, useEffect, useRef } from "react";
import {
  Bot,
  Cloud,
  Sparkles,
  Cpu,
  ChevronDown,
  Search,
} from "lucide-react";
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

const mockModel = (
  providerID: string,
  modelID: string,
  name: string,
  description: string,
): ModelConfig => ({
  providerID,
  modelID,
  name,
  description,
  maxTokens: 128_000,
  supportsStreaming: true,
  supportsTools: true,
});

const MOCK_PROVIDERS: ModelProvider[] = [
  {
    id: "anthropic",
    name: "Anthropic (mock)",
    models: [
      mockModel("anthropic", "claude-sonnet-4", "Claude Sonnet 4", "Anthropic • 200,000 context"),
      mockModel("anthropic", "claude-opus-4", "Claude Opus 4", "Anthropic • 200,000 context"),
    ],
  },
  {
    id: "openai",
    name: "OpenAI (mock)",
    models: [mockModel("openai", "gpt-4o", "GPT-4o", "OpenAI • 128,000 context")],
  },
];

export function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(
    MOCK_PROVIDERS[0]?.models[0] ?? null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const providers = MOCK_PROVIDERS;

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
              className="pl-8"
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {filteredProviders.length === 0 ? (
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
