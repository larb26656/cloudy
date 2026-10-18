import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "@repo/ui/components/sonner";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import {
  useCreateLLMConnection,
  useDeleteLLMConnection,
  useLLMConnectionSettings,
  useSetLLMDefault,
  useUpdateLLMConnection,
} from "@/hooks/queries/useLLMConnectionSettings";
import type { LLMConnection } from "@/hooks/queries/useLLMConnectionSettings";
import { LLMConnectionCard } from "./LLMConnectionCard";
import { LLMConnectionDialog } from "./LLMConnectionDialog";

export function LLMConnectionSettings() {
  const { data, isPending, error, refetch } = useLLMConnectionSettings();
  const create = useCreateLLMConnection();
  const update = useUpdateLLMConnection();
  const remove = useDeleteLLMConnection();
  const setDefault = useSetLLMDefault();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isPending) return <LoadingState className="py-12" />;
  if (error)
    return (
      <ErrorState
        message={error.message}
        onRetry={() => void refetch()}
        className="py-12"
      />
    );

  const editingConnection = data.connections.find(
    (connection) => connection.id === editingId,
  );
  const openCreateDialog = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEditDialog = (connection: LLMConnection) => {
    setEditingId(connection.id);
    setDialogOpen(true);
  };

  const saveConnection = (values: {
    type: string;
    name: string;
    config: Record<string, string>;
    modelIds: string[];
  }) => {
    if (editingConnection) {
      const updatedConfig = { ...editingConnection.config, ...values.config };
      const provider = data.providerTypes.find(
        (item) => item.id === editingConnection.type,
      );
      for (const field of provider?.configFields ?? []) {
        if (field.type === "secret" && !values.config[field.key]?.trim()) {
          delete updatedConfig[field.key];
        }
      }
      update.mutate(
        {
          id: editingConnection.id,
          name: values.name,
          config: updatedConfig,
          modelIds: values.modelIds,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            toast.success("LLM connection updated");
          },
          onError: (err) => toast.error(err.message),
        },
      );
      return;
    }
    create.mutate(
      { ...values },
      {
        onSuccess: () => {
          setDialogOpen(false);
          toast.success("LLM connection added");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">LLM Connections</h2>
          <p className="text-sm text-muted-foreground">
            Manage connections used by Cloudy AI. Secret values are never
            returned after saving.
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

      {data.connections.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.connections.map((connection) => (
            <LLMConnectionCard
              key={connection.id}
              connection={connection}
              providerTypes={data.providerTypes}
              defaultModelId={data.default?.modelId}
              isDefault={data.default?.connectionId === connection.id}
              onEdit={() => openEditDialog(connection)}
              onRemove={() =>
                remove.mutate(connection.id, {
                  onError: (err) => toast.error(err.message),
                })
              }
              onSetDefault={(modelId) =>
                setDefault.mutate(
                  { connectionId: connection.id, modelId },
                  { onError: (err) => toast.error(err.message) },
                )
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No LLM connections yet"
          description="Add a connection to use Cloudy's built-in AI."
          action={<Button onClick={openCreateDialog}>Add connection</Button>}
        />
      )}

      <LLMConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        connection={editingConnection}
        providerTypes={data.providerTypes}
        isSaving={create.isPending || update.isPending}
        onSubmit={saveConnection}
      />
    </div>
  );
}
