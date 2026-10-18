import { useEffect } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
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
import type {
  LLMConnection,
  LLMSettings,
} from "@/hooks/queries/useLLMConnectionSettings";

type ConfigField = LLMSettings["providerTypes"][number]["configFields"][number];
type FormValues = {
  type: string;
  name: string;
  config: Record<string, string>;
  modelIds: { value: string }[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: LLMConnection;
  providerTypes: LLMSettings["providerTypes"];
  isSaving: boolean;
  onSubmit: (values: {
    type: string;
    name: string;
    config: Record<string, string>;
    modelIds: string[];
  }) => void;
};

export function LLMConnectionDialog({
  open,
  onOpenChange,
  connection,
  providerTypes,
  isSaving,
  onSubmit,
}: Props) {
  const isEditing = Boolean(connection);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      type: providerTypes[0]?.id ?? "",
      name: "",
      config: {},
      modelIds: [{ value: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "modelIds",
  });
  const selectedType = useWatch({ control, name: "type" });
  const selectedProvider = providerTypes.find(
    (provider) => provider.id === (connection?.type ?? selectedType),
  );

  useEffect(() => {
    if (!open) return;
    reset(
      connection
        ? {
            type: connection.type,
            name: connection.name,
            config: Object.fromEntries(
              Object.entries(connection.config).map(([key, value]) => [
                key,
                String(value ?? ""),
              ]),
            ),
            modelIds: connection.modelIds.length
              ? connection.modelIds.map((value) => ({ value }))
              : [{ value: "" }],
          }
        : {
            type: providerTypes[0]?.id ?? "",
            name: "",
            config: {},
            modelIds: [{ value: "" }],
          },
    );
  }, [connection, open, providerTypes, reset]);

  const submit = handleSubmit((values) => {
    const submittedConfig = { ...values.config };
    for (const field of selectedProvider?.configFields ?? []) {
      if (field.type === "secret" && !submittedConfig[field.key]?.trim()) {
        delete submittedConfig[field.key];
      }
    }
    onSubmit({
      type: values.type,
      name: values.name.trim(),
      config: submittedConfig,
      modelIds: values.modelIds
        .map(({ value }) => value.trim())
        .filter(Boolean),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-3 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit provider" : "Add connection"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configure your {connection?.name ?? "provider"} connection and
            available models.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void submit(event)} className="contents">
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium">
                Name
                <Input
                  aria-label="Connection name"
                  placeholder="e.g. Personal OpenAI"
                  className="h-9 text-sm"
                  {...register("name", {
                    validate: (value) =>
                      Boolean(value.trim()) || "Connection name is required",
                  })}
                />
                {errors.name && (
                  <span className="text-xs text-destructive">
                    {errors.name.message}
                  </span>
                )}
              </label>
              {!isEditing ? (
                <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium">
                  Provider type
                  <Controller
                    control={control}
                    name="type"
                    rules={{ required: "Select a provider" }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value ?? "");
                          setValue("config", {});
                        }}
                      >
                        <SelectTrigger
                          aria-label="Provider type"
                          className="h-9 w-full font-normal"
                        >
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providerTypes.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </label>
              ) : (
                <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium">
                  Provider type
                  <Input
                    aria-label="Provider type"
                    value={selectedProvider?.name ?? connection?.type ?? ""}
                    disabled
                    className="h-9 text-sm"
                  />
                </label>
              )}
            </div>
            {selectedProvider?.configFields.map((field: ConfigField) => {
              const configuredSecret =
                field.type === "secret" &&
                connection?.secretsConfigured[field.key];
              return (
                <label
                  key={field.key}
                  className="flex flex-col gap-1.5 text-xs font-medium"
                >
                  {field.label}
                  <Input
                    aria-label={field.label}
                    type={field.type === "secret" ? "password" : "text"}
                    className="h-9 text-sm"
                    placeholder={
                      configuredSecret
                        ? "Configured — enter replacement"
                        : field.label
                    }
                    {...register(`config.${field.key}`, {
                      validate: (value) =>
                        !field.required ||
                        configuredSecret ||
                        Boolean(value?.trim())
                          ? true
                          : `${field.label} is required`,
                    })}
                  />
                  {errors.config?.[field.key]?.message && (
                    <span className="text-xs text-destructive">
                      {errors.config[field.key]?.message}
                    </span>
                  )}
                </label>
              );
            })}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Models</p>
                  <p className="text-xs text-muted-foreground">
                    Manage models available for this provider.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => append({ value: "" })}
                >
                  <Plus data-icon="inline-start" />
                  Add model
                </Button>
              </div>
              <div className="overflow-hidden rounded-lg border">
                {fields.map((field, index) => {
                  return (
                    <div
                      key={field.id}
                      className="flex min-w-0 items-center gap-2 border-b px-2 py-1.5 last:border-b-0"
                    >
                      <Input
                        aria-label={`Model ${index + 1}`}
                        placeholder="Model ID (for example: gpt-4.1)"
                        className="h-8 min-w-0 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                        {...register(`modelIds.${index}.value`, {
                          validate: (value) =>
                            Boolean(value.trim()) ||
                            "At least one model is required",
                        })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove model ${index + 1}`}
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isEditing ? "Save changes" : "Add connection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
