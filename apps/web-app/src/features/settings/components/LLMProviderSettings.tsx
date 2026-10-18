import { useState } from "react";
import { toast } from "@repo/ui/components/sonner";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { Input } from "@repo/ui/components/input";
import { LoadingState } from "@repo/ui/components/loading-state";
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
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [modelIds, setModelIds] = useState("");
  const [edits, setEdits] = useState<
    Record<
      string,
      { name?: string; config?: Record<string, string>; modelIds?: string[] }
    >
  >({});

  if (isPending) return <LoadingState className="py-12" />;
  if (error)
    return (
      <ErrorState
        message={error.message}
        onRetry={() => void refetch()}
        className="py-12"
      />
    );

  const selectedType = type || data.providerTypes[0]?.id || "";
  const selectedProvider = data.providerTypes.find(
    (provider) => provider.id === selectedType,
  );
  const missingRequiredConfig =
    selectedProvider?.configFields.some(
      (field: ConfigField) => field.required && !config[field.key]?.trim(),
    ) ?? false;

  const addConnection = () => {
    const models = modelIds
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean);
    create.mutate(
      { name, type: selectedType, config, modelIds: models },
      {
        onSuccess: () => {
          setName("");
          setConfig({});
          setModelIds("");
          toast.success("LLM connection added");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const content = data.connections.length ? (
    data.connections.map((connection) => {
      const changes = edits[connection.id] ?? {};
      const values = { ...connection, ...changes };
      const provider = data.providerTypes.find(
        (item) => item.id === connection.type,
      );
      return (
        <section
          key={connection.id}
          className="space-y-3 rounded-lg border p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              aria-label={`${connection.name} name`}
              value={values.name}
              onChange={(event) =>
                setEdits((current) => ({
                  ...current,
                  [connection.id]: {
                    ...current[connection.id],
                    name: event.target.value,
                  },
                }))
              }
            />
            <Input
              aria-label={`${connection.name} model IDs`}
              value={(values.modelIds ?? connection.modelIds).join(", ")}
              onChange={(event) =>
                setEdits((current) => ({
                  ...current,
                  [connection.id]: {
                    ...current[connection.id],
                    modelIds: event.target.value
                      .split(",")
                      .map((model) => model.trim())
                      .filter(Boolean),
                  },
                }))
              }
            />
            {provider?.configFields.map((field: ConfigField) => {
              const configured = connection.secretsConfigured[field.key];
              const fieldValue =
                changes.config?.[field.key] ??
                String(connection.config[field.key] ?? "");
              return (
                <Input
                  key={field.key}
                  aria-label={`${connection.name} ${field.label}`}
                  type={field.type === "secret" ? "password" : "text"}
                  placeholder={
                    field.type === "secret" && configured
                      ? `${field.label} configured — enter replacement`
                      : field.label
                  }
                  value={
                    field.type === "secret" &&
                    changes.config?.[field.key] === undefined
                      ? ""
                      : fieldValue
                  }
                  onChange={(event) =>
                    setEdits((current) => ({
                      ...current,
                      [connection.id]: {
                        ...current[connection.id],
                        config: {
                          ...current[connection.id]?.config,
                          [field.key]: event.target.value,
                        },
                      },
                    }))
                  }
                />
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                update.mutate(
                  {
                    id: connection.id,
                    name: changes.name,
                    config: changes.config
                      ? { ...connection.config, ...changes.config }
                      : undefined,
                    modelIds: changes.modelIds,
                  },
                  {
                    onSuccess: () =>
                      setEdits((current) => {
                        const next = { ...current };
                        delete next[connection.id];
                        return next;
                      }),
                    onError: (err) => toast.error(err.message),
                  },
                )
              }
            >
              Save
            </Button>
            <label className="flex items-center gap-2 text-sm">
              Default model
              <select
                aria-label={`${connection.name} default model`}
                className="h-9 rounded-md border border-input bg-background px-3"
                value={
                  data.default?.connectionId === connection.id
                    ? data.default.modelId
                    : ""
                }
                onChange={(event) =>
                  event.target.value &&
                  setDefault.mutate(
                    {
                      connectionId: connection.id,
                      modelId: event.target.value,
                    },
                    { onError: (err) => toast.error(err.message) },
                  )
                }
              >
                <option value="">Select model</option>
                {(values.modelIds ?? connection.modelIds).map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </label>
            <Button
              variant="destructive"
              onClick={() =>
                remove.mutate(connection.id, {
                  onError: (err) => toast.error(err.message),
                })
              }
            >
              Remove
            </Button>
          </div>
        </section>
      );
    })
  ) : (
    <EmptyState
      title="No LLM connections yet"
      description="Add a connection to use Cloudy's built-in AI."
    />
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">LLM Connections</h2>
        <p className="text-sm text-muted-foreground">
          Manage connections used by Cloudy AI. Secret values are never returned
          after saving.
        </p>
      </div>
      <div className="space-y-3">{content}</div>
      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-medium">Add connection</h3>
        <label className="block space-y-1 text-sm">
          Provider type
          <select
            aria-label="Provider type"
            className="h-9 w-full rounded-md border border-input bg-background px-3"
            value={selectedType}
            onChange={(event) => {
              setType(event.target.value);
              setConfig({});
            }}
          >
            {data.providerTypes.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </label>
        {selectedProvider?.configFields.map((field: ConfigField) => (
          <Input
            key={field.key}
            aria-label={field.label}
            type={field.type === "secret" ? "password" : "text"}
            placeholder={field.label}
            value={config[field.key] ?? ""}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                [field.key]: event.target.value,
              }))
            }
          />
        ))}
        <Input
          aria-label="Connection name"
          placeholder="Connection name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          aria-label="Model IDs"
          placeholder="Model IDs, comma separated (for example: gpt-4o-mini, gpt-4.1)"
          value={modelIds}
          onChange={(event) => setModelIds(event.target.value)}
        />
        <Button
          disabled={
            !name.trim() ||
            !selectedType ||
            missingRequiredConfig ||
            !modelIds.split(",").some((model) => model.trim()) ||
            create.isPending
          }
          onClick={addConnection}
        >
          Add connection
        </Button>
      </section>
    </div>
  );
}
