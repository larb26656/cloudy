import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ProviderSelector } from "@/components/chat/ProviderSelector";
import { useModels } from "@/hooks/queries/useModels";
import { Button } from "@repo/ui/components/button";
import { Field, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";

export const Route = createFileRoute("/agent-playground")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: AgentPlaygroundPage,
});

function AgentPlaygroundPage() {
  const { data: providers, isLoading, error, refetch } = useModels();
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [directory, setDirectory] = useState("");
  const [directoryDraft, setDirectoryDraft] = useState("");
  const provider =
    providers?.find((item) => item.id === selectedProviderId) ?? providers?.[0];
  const providerId = provider?.id ?? "";
  const requiresDirectory = provider?.capabilities.requiresDirectory ?? false;
  const ready = !!provider && (!requiresDirectory || !!directory);

  const applyDirectory = () => {
    const nextDirectory = directoryDraft.trim();
    if (requiresDirectory && !nextDirectory) return;
    if (nextDirectory !== directory) {
      setDirectory(nextDirectory);
      setSessionId(null);
    }
  };

  return (
    <main className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <Link
          to="/"
          aria-label="Back to home"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold">Agent Playground</h1>
          <p className="text-xs text-muted-foreground">
            Try a provider with the same chat interface.
          </p>
        </div>
        {ready && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSessionId(null)}
          >
            <RotateCcw data-icon="inline-start" />
            New session
          </Button>
        )}
      </header>

      <div className="flex flex-wrap items-end gap-3 border-b px-4 py-3">
        <Field className="w-full sm:w-56">
          <FieldLabel>Provider</FieldLabel>
          {provider && (
            <ProviderSelector
              providerId={providerId}
              onChange={(id) => {
                setSelectedProviderId(id);
                setSessionId(null);
              }}
            />
          )}
        </Field>
        {requiresDirectory && (
          <Field className="min-w-0 flex-1 sm:min-w-64">
            <FieldLabel htmlFor="playground-directory">
              Project directory
            </FieldLabel>
            <Input
              id="playground-directory"
              value={directoryDraft}
              onChange={(event) => setDirectoryDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") applyDirectory();
              }}
              placeholder="Absolute project path"
            />
          </Field>
        )}
        {requiresDirectory && (
          <Button
            variant="secondary"
            onClick={applyDirectory}
            disabled={
              !directoryDraft.trim() || directoryDraft.trim() === directory
            }
          >
            Use directory
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <LoadingState title="Loading providers..." />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => void refetch()} />
        ) : !provider ? (
          <EmptyState title="No providers available" />
        ) : !ready ? (
          <EmptyState
            title="Choose a project directory"
            description="This provider needs a project directory before you can chat."
          />
        ) : (
          <ChatContainer
            key={`${providerId}:${directory}`}
            providerId={providerId}
            directory={directory}
            sessionId={sessionId}
            onSessionChange={setSessionId}
          />
        )}
      </div>
    </main>
  );
}
