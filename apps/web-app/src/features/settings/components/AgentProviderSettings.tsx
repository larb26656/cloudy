import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "@repo/ui/components/sonner";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import {
  useCreateAgentProviderInstance,
  useDeleteAgentProviderInstance,
  useAgentProviderSettings,
  useAgentProviderTemplates,
  useUpdateAgentProviderInstance,
} from "@/hooks/queries/useAgentProviderSettings";
import type { AgentProviderInstance } from "@/hooks/queries/useAgentProviderSettings";
import { AgentProviderCard } from "./AgentProviderCard";
import { AgentProviderDialog } from "./AgentProviderDialog";

export function AgentProviderSettings() {
  const { data, isPending, error, refetch } = useAgentProviderSettings();
  const templates = useAgentProviderTemplates();
  const create = useCreateAgentProviderInstance();
  const update = useUpdateAgentProviderInstance();
  const remove = useDeleteAgentProviderInstance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] =
    useState<AgentProviderInstance | null>(null);

  if (isPending) return <LoadingState className="py-12" />;
  if (error)
    return (
      <ErrorState
        message={error.message}
        onRetry={() => void refetch()}
        className="py-12"
      />
    );

  if (templates.isError)
    return (
      <ErrorState
        message={templates.error.message}
        onRetry={() => void templates.refetch()}
        className="py-12"
      />
    );

  if (templates.isPending) return <LoadingState className="py-12" />;

  const openCreateDialog = () => {
    setEditingProvider(null);
    setDialogOpen(true);
  };

  const openEditDialog = (provider: AgentProviderInstance) => {
    setEditingProvider(provider);
    setDialogOpen(true);
  };

  const saveProvider = (values: {
    name: string;
    templateId: AgentProviderInstance["templateId"];
    baseUrl: string;
  }) => {
    if (editingProvider) {
      update.mutate(
        { id: editingProvider.id, name: values.name, baseUrl: values.baseUrl },
        {
          onSuccess: () => {
            setDialogOpen(false);
            toast.success("Provider connection updated");
          },
          onError: (err) => toast.error(err.message),
        },
      );
      return;
    }

    create.mutate(
      { ...values, enabled: true },
      {
        onSuccess: () => {
          setDialogOpen(false);
          toast.success("Provider connection added");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Agent Providers</h2>
          <p className="text-sm text-muted-foreground">
            Manage agent provider connections. Changes apply immediately.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Add connection"
          title="Add connection"
          onClick={openCreateDialog}
        >
          <Plus data-icon="inline-start" />
        </Button>
      </div>

      {data.instances.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.instances.map((provider) => (
            <AgentProviderCard
              key={provider.id}
              provider={provider}
              onEdit={() => openEditDialog(provider)}
              onRemove={() =>
                remove.mutate(provider.id, {
                  onSuccess: () => toast.success("Provider connection removed"),
                  onError: (err) => toast.error(err.message),
                })
              }
              onEnabledChange={(enabled) =>
                update.mutate(
                  { id: provider.id, enabled },
                  { onError: (err) => toast.error(err.message) },
                )
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No agent providers yet"
          description="Add a provider connection to use an agent with Cloudy."
          action={<Button onClick={openCreateDialog}>Add connection</Button>}
        />
      )}

      <AgentProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        provider={editingProvider ?? undefined}
        templates={templates.data.templates}
        isSaving={create.isPending || update.isPending}
        onSubmit={saveProvider}
      />
    </div>
  );
}
