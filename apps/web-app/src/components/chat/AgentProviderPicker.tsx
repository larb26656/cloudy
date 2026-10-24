import { useMemo, useState } from "react";
import { Bot, Search } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { ProviderIcon } from "@/components/provider/ProviderIcon";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useModels } from "@/hooks/queries/useModels";

interface AgentProviderPickerProps {
  label: string;
  onSelect: (providerId: string, agentId: string) => void;
}

export function AgentProviderPicker({
  label,
  onSelect,
}: AgentProviderPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { isMobile } = useDeviceType();
  const { data: providers = [], isLoading, error } = useModels();
  const normalizedSearch = search.trim().toLowerCase();
  const providersWithAgents = useMemo(
    () =>
      providers
        .map((provider) => ({
          ...provider,
          agents: (provider.agents ?? []).filter(
            (agent) =>
              !agent.hidden &&
              (agent.mode === undefined || agent.mode === "primary") &&
              (!normalizedSearch ||
                `${provider.name} ${provider.id} ${agent.name ?? agent.id} ${agent.description ?? ""}`
                  .toLowerCase()
                  .includes(normalizedSearch)),
          ),
        }))
        .filter((provider) => provider.agents.length > 0),
    [providers, normalizedSearch],
  );

  const handleSelect = (providerId: string, agentId: string) => {
    setOpen(false);
    setSearch("");
    onSelect(providerId, agentId);
  };

  let options;
  if (isLoading) {
    options = <LoadingState size="compact" title="Loading agents..." />;
  } else if (error) {
    options = (
      <ErrorState size="compact" bare message="Failed to load agents" />
    );
  } else if (providersWithAgents.length === 0) {
    options = <EmptyState size="compact" title="No agents found" />;
  } else {
    options = (
      <div className="flex flex-col gap-4">
        {providersWithAgents.map((provider) => (
          <section key={provider.id} className="flex flex-col gap-1">
            <h3 className="flex items-center gap-2 px-2 pb-1 text-xs font-medium text-muted-foreground">
              <ProviderIcon providerId={provider.id} />
              {provider.name}
            </h3>
            {provider.agents.map((agent) => (
              <button
                key={`${provider.id}:${agent.id}`}
                type="button"
                onClick={() => handleSelect(provider.id, agent.id)}
                className="flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Bot className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {agent.name ?? agent.id}
                  </span>
                  {agent.description && (
                    <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                      {agent.description}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </section>
        ))}
      </div>
    );
  }

  const pickerContent = (
    <>
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search agents or providers..."
          className="pl-9"
        />
      </div>
      <div className="max-h-[min(60dvh,28rem)] overflow-y-auto pr-1">
        {options}
      </div>
    </>
  );

  return (
    <>
      <Button variant="default" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85dvh] gap-4 rounded-t-xl"
          >
            <SheetHeader>
              <SheetTitle>Select an agent</SheetTitle>
              <SheetDescription>
                Choose an agent provider to start a chat.
              </SheetDescription>
            </SheetHeader>
            {pickerContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="gap-4 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Select an agent</DialogTitle>
              <DialogDescription>
                Choose an agent provider to start a chat.
              </DialogDescription>
            </DialogHeader>
            {pickerContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
