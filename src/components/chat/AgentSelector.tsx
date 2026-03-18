// components/chat/AgentSelector.tsx
import { useState, useEffect, useRef } from "react";
import {
  Bot,
  ChevronDown,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgentStore } from "@/stores";

const agentModeLabels: Record<string, string> = {
  primary: "Primary",
  subagent: "Subagent",
  all: "All",
};

export function AgentSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { agents, isLoading, error, fetchAgents, selectedAgent, setSelectedAgent } = useAgentStore();

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
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

  const filteredAgents = searchQuery
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : agents;

  const getDisplayName = () => {
    if (!selectedAgent) return "Default Agent";
    const agent = agents.find((a) => a.name === selectedAgent);
    return agent?.name || selectedAgent;
  };

  const handleSelectAgent = (agentName: string | null) => {
    setSelectedAgent(agentName);
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
              placeholder="Search agents..."
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
          ) : filteredAgents.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No agents found
            </div>
          ) : (
            filteredAgents.map((agent) => (
              <DropdownMenuGroup key={agent.name}>
                <DropdownMenuItem
                  onClick={() => handleSelectAgent(agent.name)}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{agent.name}</div>
                    {agent.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {agent.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    {agent.mode && (
                      <span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                        {agentModeLabels[agent.mode] || agent.mode}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            ))
          )}
        </div>
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
