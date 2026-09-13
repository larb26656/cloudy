import { useState, useEffect, useRef } from "react";
import { Bot, ChevronDown, Search } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import type { Agent } from "@/types/agent";
import { useAgents } from "@/hooks/queries/useAgents";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useChat } from "./ChatProvider";

const agentModeLabels: Record<string, string> = {
  primary: "Primary",
  subagent: "Subagent",
  all: "All",
};

const FALLBACK_AGENTS: Agent[] = [
  {
    name: "build",
    description: "Default build agent (offline)",
    mode: "primary",
    native: true,
  },
];

export function AgentSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { effectiveAgent, setAgent, directory } = useChat();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, error } = useAgents({ directory });
  const agents = data ?? FALLBACK_AGENTS;
  const { isMobile } = useDeviceType();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const filteredAgents = searchQuery
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.description &&
            a.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : agents;

  const getDisplayName = () => {
    if (!effectiveAgent) return "Default Agent";
    const agent = agents.find((a) => a.name === effectiveAgent);
    return agent?.name || effectiveAgent;
  };

  const handleSelectAgent = (agentName: string | null) => {
    setAgent(agentName);
    setIsOpen(false);
    setSearchQuery("");
  };

  const options = (
    <>
      {isLoading ? (
        <LoadingState size="compact" title={null} />
      ) : error ? (
        <ErrorState size="compact" bare message={(error as Error).message} />
      ) : filteredAgents.length === 0 ? (
        <EmptyState size="compact" title="No agents found" />
      ) : isMobile ? (
        filteredAgents.map((agent) => (
          <button
            key={agent.name}
            type="button"
            onClick={() => handleSelectAgent(agent.name)}
            className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate">{agent.name}</div>
              {agent.description && (
                <div className="truncate text-xs text-muted-foreground">
                  {agent.description}
                </div>
              )}
            </div>
            {agent.mode && (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {agentModeLabels[agent.mode] || agent.mode}
              </span>
            )}
          </button>
        ))
      ) : (
        <DropdownMenuGroup>
          {filteredAgents.map((agent) => (
            <DropdownMenuItem
              key={agent.name}
              onClick={() => handleSelectAgent(agent.name)}
              className="flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate">{agent.name}</div>
                {agent.description && (
                  <div className="truncate text-xs text-muted-foreground">
                    {agent.description}
                  </div>
                )}
              </div>
              {agent.mode && (
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {agentModeLabels[agent.mode] || agent.mode}
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      )}
    </>
  );

  const searchInput = (
    <div className="p-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search agents..."
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
              <SheetTitle>Select agent</SheetTitle>
            </SheetHeader>
            {searchInput}
            <div className="min-h-0 flex-1 overflow-y-auto border-y py-1">
              {options}
            </div>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => handleSelectAgent(null)}
                className="px-4 py-3 text-left text-sm font-medium hover:bg-muted"
              >
                Use Default Agent
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
            <DropdownMenuItem onClick={() => handleSelectAgent(null)}>
              Use Default Agent
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
