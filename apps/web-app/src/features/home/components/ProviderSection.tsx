import { useModels } from "@/hooks/queries";
import { useNewChat } from "@/hooks/useNewChat";
import { ProviderIcon } from "@/components/provider/ProviderIcon";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";

export function ProviderSection() {
  const { data: providers = [], isLoading, error } = useModels();
  const { create, createTemp, isCreatingTemp } = useNewChat();

  const handleProviderSelect = (provider: (typeof providers)[number]) => {
    const { id: providerId } = provider;
    if (provider.capabilities.requiresDirectory === false) {
      create({ providerId, directory: "" });
      return;
    }

    createTemp({ providerId });
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
        <div className="overflow-x-auto">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:w-max lg:gap-2">
            {providers.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => handleProviderSelect(provider)}
                disabled={isCreatingTemp}
                className="flex min-h-14 items-center gap-3 rounded-lg border bg-background px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-50 lg:h-16 lg:w-20 lg:min-h-0 lg:shrink-0 lg:flex-col lg:justify-center lg:gap-1 lg:px-2 lg:py-2 lg:text-center"
              >
                <ProviderIcon providerId={provider.id} className="size-5" />
                <span className="w-full truncate">
                  {provider.name || provider.id}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
