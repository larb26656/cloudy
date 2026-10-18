import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/sonner";
import { ErrorState } from "@repo/ui/components/error-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import type { AgentProviderInstance } from "@/hooks/queries/useAgentProviderSettings";
import { useAgentProviderTemplates } from "@/hooks/queries/useAgentProviderSettings";
import { getProviderConfigForm } from "./provider-config/registry";

type ProviderTemplate = NonNullable<
  ReturnType<typeof useAgentProviderTemplates>["data"]
>["templates"][number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: AgentProviderInstance;
  templates: ProviderTemplate[];
  isSaving: boolean;
  onSubmit: (values: {
    name: string;
    templateId: AgentProviderInstance["templateId"];
    baseUrl: string;
  }) => void;
};

export function AgentProviderDialog({
  open,
  onOpenChange,
  provider,
  templates,
  isSaving,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState<
    AgentProviderInstance["templateId"]
  >(templates[0]?.id ?? "opencode");
  const [baseUrl, setBaseUrl] = useState("");
  const isEditing = Boolean(provider);

  useEffect(() => {
    if (!open) return;
    setName(provider?.name ?? templates[0]?.name ?? "OpenCode");
    setTemplateId(provider?.templateId ?? templates[0]?.id ?? "opencode");
    setBaseUrl(provider?.baseUrl ?? "http://localhost:4096");
  }, [open, provider, templates]);

  const ConfigFields = getProviderConfigForm(templateId);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let url: string;
    try {
      url = new URL(baseUrl).toString().replace(/\/$/, "");
    } catch {
      toast.error("Enter a valid server URL, including http:// or https://");
      return;
    }
    onSubmit({ name: name.trim(), templateId, baseUrl: url });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-3 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit provider" : "Add connection"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configure the agent provider connection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="contents">
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium">
                Name
                <Input
                  aria-label="Connection name"
                  placeholder="e.g. Personal OpenCode"
                  className="h-9 text-sm"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium">
                Provider type
                {isEditing ? (
                  <Input
                    aria-label="Provider type"
                    value={provider?.templateId ?? templateId}
                    disabled
                    className="h-9 text-sm"
                  />
                ) : (
                  <Select
                    value={templateId}
                    onValueChange={(value) => {
                      const selected = templates.find(
                        (template) => template.id === value,
                      );
                      if (selected) {
                        setTemplateId(selected.id);
                        setName(selected.name);
                      }
                    }}
                  >
                    <SelectTrigger
                      aria-label="Provider type"
                      className="h-9 w-full font-normal"
                    >
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </label>
            </div>
            {ConfigFields ? (
              <label className="flex flex-col gap-1.5 text-xs font-medium">
                Server URL
                <ConfigFields
                  baseUrl={baseUrl}
                  onBaseUrlChange={setBaseUrl}
                  label="Server URL"
                />
              </label>
            ) : (
              <ErrorState
                size="inline"
                bare
                message="This provider template is not supported by this version of Cloudy."
              />
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !ConfigFields}>
              {isEditing ? "Save changes" : "Add connection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
