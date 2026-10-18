import { useEffect } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
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
} from "@/hooks/queries/useLLMProviderSettings";

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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit connection" : "Add connection"}
          </DialogTitle>
          <DialogDescription>
            Configure the provider, credentials, and models available to Cloudy
            AI.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void submit(event)} className="contents">
          <div className="flex flex-col gap-4">
            {!isEditing && (
              <label className="flex flex-col gap-2 text-sm font-medium">
                Provider
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
                        className="w-full font-normal"
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
            )}
            <label className="flex flex-col gap-2 text-sm font-medium">
              Connection name
              <Input
                aria-label="Connection name"
                placeholder="e.g. Personal OpenAI"
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
            {selectedProvider?.configFields.map((field: ConfigField) => {
              const configuredSecret =
                field.type === "secret" &&
                connection?.secretsConfigured[field.key];
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
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-sm font-medium">Models</p>
                <p className="text-xs text-muted-foreground">
                  Add each model using its exact provider ID.
                </p>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    aria-label={`Model ${index + 1}`}
                    placeholder="Model ID (for example: gpt-4.1)"
                    {...register(`modelIds.${index}.value`, {
                      validate: (value) =>
                        Boolean(value.trim()) ||
                        "At least one model is required",
                    })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Remove model ${index + 1}`}
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ value: "" })}
                >
                  Add model
                </Button>
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
