import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "@repo/ui/components/sonner";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { Input } from "@repo/ui/components/input";
import { LoadingState } from "@repo/ui/components/loading-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  useCreateLLMConnection,
  useDeleteLLMConnection,
  useLLMProviderSettings,
  useSetLLMDefault,
  useUpdateLLMConnection,
} from "@/hooks/queries/useLLMProviderSettings";

type ConfigField = {
  key: string;
  label: string;
  type: "text" | "url" | "secret";
  required?: boolean;
};

export function LLMProviderSettings() {
  const { data, isPending, error, refetch } = useLLMProviderSettings();
  const create = useCreateLLMConnection();
  const update = useUpdateLLMConnection();
  const remove = useDeleteLLMConnection();
  const setDefault = useSetLLMDefault();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [modelIds, setModelIds] = useState<string[]>([""]);

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
  const selectedType = editingConnection?.type ?? type;
  const selectedProvider = data.providerTypes.find(
    (provider) => provider.id === selectedType,
  );
  const missingRequiredConfig =
    selectedProvider?.configFields.some(
      (field: ConfigField) =>
        field.required &&
        !config[field.key]?.trim() &&
        !(
          editingConnection?.secretsConfigured[field.key] &&
          field.type === "secret"
        ),
    ) ?? false;
  const cleanModels = modelIds.map((model) => model.trim()).filter(Boolean);
  const canSave =
    name.trim() &&
    selectedType &&
    !missingRequiredConfig &&
    cleanModels.length > 0;

  const openCreateDialog = () => {
    setEditingId(null);
    setName("");
    setType(data.providerTypes[0]?.id ?? "");
    setConfig({});
    setModelIds([""]);
    setDialogOpen(true);
  };

  const openEditDialog = (connection: (typeof data.connections)[number]) => {
    setEditingId(connection.id);
    setName(connection.name);
    setConfig(
      Object.fromEntries(
        Object.entries(connection.config).map(([key, value]) => [
          key,
          String(value ?? ""),
        ]),
      ),
    );
    setModelIds(connection.modelIds.length ? [...connection.modelIds] : [""]);
    setDialogOpen(true);
  };

  const saveConnection = () => {
    if (!canSave) return;
    if (editingConnection) {
      const updatedConfig = { ...editingConnection.config, ...config };
      for (const field of selectedProvider?.configFields ?? []) {
        if (field.type === "secret" && !config[field.key]?.trim()) {
          delete updatedConfig[field.key];
        }
      }
      update.mutate(
        {
          id: editingConnection.id,
          name: name.trim(),
          config: updatedConfig,
          modelIds: cleanModels,
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
      { name: name.trim(), type: selectedType, config, modelIds: cleanModels },
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
          {data.connections.map((connection) => {
            const provider = data.providerTypes.find(
              (item) => item.id === connection.type,
            );
            const isDefault = data.default?.connectionId === connection.id;
            return (
              <Card key={connection.id}>
                <CardHeader>
                  <CardTitle>{connection.name}</CardTitle>
                  <CardAction>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(connection)}
                    >
                      Edit
                    </Button>
                  </CardAction>
                  <p className="text-sm text-muted-foreground">
                    {provider?.name ?? connection.type}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {connection.modelIds.map((model) => (
                    <span
                      key={model}
                      className="max-w-full truncate rounded-md border bg-muted px-2 py-1 text-xs"
                      title={model}
                    >
                      {model}
                    </span>
                  ))}
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="shrink-0">Default model</span>
                    <Select
                      value={isDefault ? (data.default?.modelId ?? null) : null}
                      onValueChange={(modelId) =>
                        modelId &&
                        setDefault.mutate(
                          { connectionId: connection.id, modelId },
                          { onError: (err) => toast.error(err.message) },
                        )
                      }
                    >
                      <SelectTrigger
                        aria-label={`${connection.name} default model`}
                        className="min-w-0"
                      >
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {connection.modelIds.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      remove.mutate(connection.id, {
                        onError: (err) => toast.error(err.message),
                      })
                    }
                  >
                    Remove
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No LLM connections yet"
          description="Add a connection to use Cloudy's built-in AI."
          action={<Button onClick={openCreateDialog}>Add connection</Button>}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingConnection ? "Edit connection" : "Add connection"}
            </DialogTitle>
            <DialogDescription>
              Configure the provider, credentials, and models available to
              Cloudy AI.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {!editingConnection && (
              <label className="flex flex-col gap-2 text-sm font-medium">
                Provider
                <Select
                  value={type}
                  onValueChange={(value) => {
                    setType(value ?? "");
                    setConfig({});
                  }}
                >
                  <SelectTrigger
                    aria-label="Provider type"
                    className="w-full font-normal"
                  >
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.providerTypes.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            )}
            <label className="flex flex-col gap-2 text-sm font-medium">
              Connection name
              <Input
                aria-label="Connection name"
                placeholder="e.g. Personal OpenAI"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            {selectedProvider?.configFields.map((field: ConfigField) => {
              const configuredSecret =
                field.type === "secret" &&
                editingConnection?.secretsConfigured[field.key];
              return (
                <label
                  key={field.key}
                  className="flex flex-col gap-2 text-sm font-medium"
                >
                  {field.label}
                  <Input
                    aria-label={field.label}
                    type={field.type === "secret" ? "password" : "text"}
                    placeholder={
                      configuredSecret
                        ? "Configured — enter replacement"
                        : field.label
                    }
                    value={
                      configuredSecret && !config[field.key]
                        ? ""
                        : (config[field.key] ?? "")
                    }
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                  />
                </label>
              );
            })}
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-sm font-medium">Models</p>
                <p className="text-xs text-muted-foreground">
                  Add each model using its exact provider ID.
                </p>
              </div>
              {modelIds.map((model, index) => (
                <div key={`model-${index}`} className="flex gap-2">
                  <Input
                    aria-label={`Model ${index + 1}`}
                    placeholder="Model ID (for example: gpt-4.1)"
                    value={model}
                    onChange={(event) =>
                      setModelIds((current) =>
                        current.map((value, modelIndex) =>
                          modelIndex === index ? event.target.value : value,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Remove model ${index + 1}`}
                    disabled={modelIds.length === 1}
                    onClick={() =>
                      setModelIds((current) =>
                        current.filter((_, modelIndex) => modelIndex !== index),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModelIds((current) => [...current, ""])}
                >
                  Add model
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canSave || create.isPending || update.isPending}
              onClick={saveConnection}
            >
              {editingConnection ? "Save changes" : "Add connection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
