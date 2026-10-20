import { useTabStore } from "@/stores/tabStore";
import { useRecentDirectoryStore } from "@/stores/recentDirectoryStore";
import { useCreateTempWorkspace, useModels } from "@/hooks/queries";
import { ProviderIcon } from "@/components/provider/ProviderIcon";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";

export function ProviderSection() {
  const { data: providers = [], isLoading, error } = useModels();
  const addTab = useTabStore((s) => s.addTab);
  const pushRecentDirectory = useRecentDirectoryStore((s) => s.push);
  const createTempWorkspace = useCreateTempWorkspace();

  const handleProviderSelect = (provider: (typeof providers)[number]) => {
    const { id: providerId } = provider;
    if (provider.capabilities.requiresDirectory === false) {
      addTab("chat", {
        providerId,
        sessionId: null,
        workspaceId: null,
        directory: "",
        sessionName: "New Chat",
      });
      return;
    }

    createTempWorkspace.mutate(undefined, {
      onSuccess: ({ name, directory }) => {
        pushRecentDirectory(directory);
        addTab("chat", {
          providerId,
          sessionId: null,
          workspaceId: null,
          directory,
          sessionName: name,
        });
      },
    });
  };

  if (providers.length === 0 && !isLoading && !error) return null;

  return (
    <section className="mb-9">
      <h2 className="mb-3.5 text-sm font-bold">Start with a provider</h2>
      {isLoading ? (
        <LoadingState
          size="inline"
          title="Loading providers..."
          spinner={false}
        />
      ) : error ? (
        <ErrorState size="inline" bare message="Failed to load providers" />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleProviderSelect(provider)}
              disabled={createTempWorkspace.isPending}
              className="flex min-h-14 items-center gap-3 rounded-lg border bg-background px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-50"
            >
              <ProviderIcon providerId={provider.id} className="size-5" />
              <span className="truncate">{provider.name || provider.id}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
