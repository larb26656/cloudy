import { useState } from "react";
import { toast } from "@repo/ui/components/sonner";
import { Button } from "@repo/ui/components/button";
import { ErrorState } from "@repo/ui/components/error-state";
import { Input } from "@repo/ui/components/input";
import { LoadingState } from "@repo/ui/components/loading-state";
import { Switch } from "@repo/ui/components/switch";
import {
  useCreateAgentProviderInstance,
  useDeleteAgentProviderInstance,
  useAgentProviderSettings,
  useAgentProviderTemplates,
  useUpdateAgentProviderInstance,
} from "@/hooks/queries/useAgentProviderSettings";
import type { AgentProviderInstance } from "@/hooks/queries/useAgentProviderSettings";
import { getProviderConfigForm } from "./provider-config/registry";

export function AgentProviderSettings() {
  const { data, isPending, error, refetch } = useAgentProviderSettings();
  const templates = useAgentProviderTemplates();
  const create = useCreateAgentProviderInstance();
  const update = useUpdateAgentProviderInstance();
  const remove = useDeleteAgentProviderInstance();
  const [name, setName] = useState("OpenCode");
  const [baseUrl, setBaseUrl] = useState("http://localhost:4096");
  const [templateId, setTemplateId] =
    useState<AgentProviderInstance["templateId"]>("opencode");
  const [editedBaseUrls, setEditedBaseUrls] = useState<Record<string, string>>(
    {},
  );

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

  const add = () => {
    let url: string;
    try {
      url = new URL(baseUrl).toString().replace(/\/$/, "");
    } catch {
      toast.error("Enter a valid server URL, including http:// or https://");
      return;
    }
    create.mutate(
      { name, templateId, enabled: true, baseUrl: url },
      {
        onSuccess: () => toast.success("Provider connection added"),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Agent Providers</h2>
        <p className="text-sm text-muted-foreground">
          Manage agent provider connections. Changes apply immediately.
        </p>
      </div>
      <div className="space-y-3">
        {data?.instances.map((instance) => (
          <section
            key={instance.id}
            className="space-y-4 rounded-lg border p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <Input
                aria-label="Connection name"
                defaultValue={instance.name}
                onBlur={(event) => {
                  const name = event.currentTarget.value.trim();
                  if (name && name !== instance.name)
                    update.mutate(
                      { id: instance.id, name },
                      { onError: (err) => toast.error(err.message) },
                    );
                }}
              />
              <Switch
                checked={instance.enabled}
                aria-label={`Enable ${instance.name}`}
                onCheckedChange={(enabled) =>
                  update.mutate({ id: instance.id, enabled })
                }
              />
            </div>
            {(() => {
              const ConfigFields = getProviderConfigForm(instance.templateId);
              if (!ConfigFields) return null;
              const baseUrl = editedBaseUrls[instance.id] ?? instance.baseUrl;
              return (
                <ConfigFields
                  baseUrl={baseUrl}
                  onBaseUrlChange={(value) =>
                    setEditedBaseUrls((current) => ({
                      ...current,
                      [instance.id]: value,
                    }))
                  }
                  label="Server URL"
                />
              );
            })()}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  let url: string;
                  try {
                    url = new URL(
                      editedBaseUrls[instance.id] ?? instance.baseUrl,
                    )
                      .toString()
                      .replace(/\/$/, "");
                  } catch {
                    toast.error(
                      "Enter a valid server URL, including http:// or https://",
                    );
                    return;
                  }
                  if (url !== instance.baseUrl) {
                    update.mutate(
                      { id: instance.id, baseUrl: url },
                      {
                        onSuccess: () =>
                          setEditedBaseUrls((current) => {
                            const next = { ...current };
                            delete next[instance.id];
                            return next;
                          }),
                        onError: (err) => toast.error(err.message),
                      },
                    );
                  }
                }}
              >
                Save connection settings
              </Button>
              <Button
                variant="destructive"
                onClick={() => remove.mutate(instance.id)}
              >
                Remove
              </Button>
            </div>
          </section>
        ))}
      </div>
      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-medium">Add provider connection</h3>
        <select
          aria-label="Provider template"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={templateId}
          onChange={(event) => {
            const selectedTemplate = templates.data.templates.find(
              (template) => template.id === event.target.value,
            );
            if (selectedTemplate) {
              setTemplateId(selectedTemplate.id);
              setName(selectedTemplate.name);
            }
          }}
        >
          {templates.data.templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <Input
          aria-label="New connection name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {(() => {
          const ConfigFields = getProviderConfigForm(templateId);
          return ConfigFields ? (
            <ConfigFields
              baseUrl={baseUrl}
              onBaseUrlChange={setBaseUrl}
              label="New server URL"
            />
          ) : (
            <ErrorState
              size="inline"
              bare
              message="This provider template is not supported by this version of Cloudy."
            />
          );
        })()}
        <Button onClick={add} disabled={create.isPending}>
          Add connection
        </Button>
      </section>
    </div>
  );
}
