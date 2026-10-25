import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@repo/ui/components/button";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Checkbox } from "@repo/ui/components/checkbox";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { ProviderSelector } from "@/components/chat/ProviderSelector";
import { AgentSelector } from "@/components/chat/AgentSelector";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { useModels } from "@/hooks/queries/useModels";
import type { AutomationInput } from "@/hooks/queries/useAutomations";
import { CronExpressionInput, isValidCron } from "./CronExpressionInput";

const formSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    prompt: z.string().trim().min(1, "Prompt is required"),
    providerInstanceId: z.string().min(1, "Provider instance is required"),
    agentId: z.string().optional(),
    model: z.object({ providerId: z.string(), modelId: z.string() }).optional(),
    directoryMode: z.enum(["temp", "specified"]),
    directoryPath: z.string().optional(),
    schedule: z
      .object({
        cron: z.string().refine(isValidCron, "Invalid cron expression"),
        timezone: z.string().refine((value) => {
          try {
            new Intl.DateTimeFormat("en", { timeZone: value });
            return true;
          } catch {
            return false;
          }
        }, "Enter a valid IANA timezone."),
        enabled: z.boolean(),
      })
      .optional(),
  })
  .superRefine((value, context) => {
    if (value.directoryMode === "specified" && !value.directoryPath?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["directoryPath"],
        message: "Directory path is required",
      });
    }
  });

type FormValues = z.input<typeof formSchema>;

export function AutomationFormDialog({
  open,
  values,
  isEditing,
  saving,
  inline = false,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  values: AutomationInput;
  isEditing: boolean;
  saving: boolean;
  inline?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AutomationInput) => void;
}) {
  const { data: providers = [] } = useModels();
  const [confirmScheduleRemoval, setConfirmScheduleRemoval] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: values,
    mode: "onChange",
  });
  const { reset } = form;
  const value = form.watch();
  const provider = providers.find(
    (item) => item.id === value.providerInstanceId,
  );
  const models = provider?.models ?? [];

  useEffect(() => {
    if (open) reset(values);
  }, [open, values, reset]);

  const setSchedule = (cron: string) => {
    form.setValue(
      "schedule",
      cron
        ? {
            cron,
            timezone:
              form.getValues("schedule.timezone") ??
              Intl.DateTimeFormat().resolvedOptions().timeZone,
            enabled: form.getValues("schedule.enabled") ?? true,
          }
        : undefined,
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const formContent = (
    <div
      className={
        inline
          ? "flex flex-col gap-4"
          : "flex min-h-0 flex-col gap-4 overflow-hidden"
      }
    >
      {inline ? (
        <div>
          <h2 className="text-lg font-semibold">Edit automation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure the prompt, agent, working directory, and optional
            schedule.
          </p>
        </div>
      ) : (
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {isEditing ? "Edit automation" : "New automation"}
          </DialogTitle>
          <DialogDescription>
            Configure the prompt, agent, working directory, and optional
            schedule.
          </DialogDescription>
        </DialogHeader>
      )}
      <form
        id="automation-form"
        onSubmit={form.handleSubmit((data) =>
          onSubmit(data as AutomationInput),
        )}
        className={inline ? "" : "min-h-0 overflow-y-auto"}
      >
        <FieldGroup className="gap-4 pr-1">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="automation-name">Name</FieldLabel>
                <Input
                  {...field}
                  id="automation-name"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="prompt"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="automation-prompt">Prompt</FieldLabel>
                <Textarea
                  {...field}
                  id="automation-prompt"
                  aria-invalid={fieldState.invalid}
                  className="min-h-32 max-h-64 resize-y overflow-y-auto"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Field>
            <FieldLabel htmlFor="automation-provider">
              Provider instance
            </FieldLabel>
            {/* Keep providers with approval/question support selectable for automations. */}
            <ProviderSelector
              providerId={value.providerInstanceId}
              variant="form"
              triggerAriaLabel="Provider instance"
              onChange={(providerInstanceId) => {
                form.setValue("providerInstanceId", providerInstanceId, {
                  shouldValidate: true,
                });
                form.setValue("agentId", undefined);
                form.setValue("model", undefined);
              }}
            />
          </Field>
          {provider?.capabilities.agents && (
            <Field>
              <FieldLabel>Agent</FieldLabel>
              <AgentSelector
                variant="form"
                providerId={value.providerInstanceId}
                value={value.agentId ?? null}
                onChange={(agentId) =>
                  form.setValue("agentId", agentId ?? undefined)
                }
              />
            </Field>
          )}
          {provider?.capabilities.models && (
            <Controller
              name="model"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Model</FieldLabel>
                  <ModelSelector
                    variant="form"
                    providerId={value.providerInstanceId}
                    triggerAriaLabel="Model"
                    value={
                      models.find(
                        (model) =>
                          model.providerId === field.value?.providerId &&
                          model.modelId === field.value?.modelId,
                      ) ?? null
                    }
                    onChange={(model) =>
                      field.onChange(
                        model
                          ? {
                              providerId: model.providerId,
                              modelId: model.modelId,
                            }
                          : undefined,
                      )
                    }
                  />
                </Field>
              )}
            />
          )}
          {provider?.capabilities.requiresDirectory && (
            <FieldSet className="gap-3">
              <FieldLegend variant="label">Working directory</FieldLegend>
              <Controller
                name="directoryMode"
                control={form.control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={(next) => {
                      if (next === "temp" || next === "specified") {
                        field.onChange(next);
                        if (next === "temp")
                          form.setValue("directoryPath", undefined);
                      }
                    }}
                  >
                    <Field orientation="horizontal">
                      <RadioGroupItem value="temp" id="directory-temp" />
                      <FieldLabel htmlFor="directory-temp">
                        Fresh temporary directory per run
                      </FieldLabel>
                    </Field>
                    <Field orientation="horizontal">
                      <RadioGroupItem
                        value="specified"
                        id="directory-specified"
                      />
                      <FieldLabel htmlFor="directory-specified">
                        Specified path
                      </FieldLabel>
                    </Field>
                  </RadioGroup>
                )}
              />
              {value.directoryMode === "specified" && (
                <Controller
                  name="directoryPath"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="automation-directory">
                        Directory path
                      </FieldLabel>
                      <Input
                        {...field}
                        id="automation-directory"
                        value={field.value ?? ""}
                        placeholder="/path/to/project"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}
            </FieldSet>
          )}
          <FieldSet className="gap-3">
            <FieldLegend variant="label">Schedule (optional)</FieldLegend>
            <Field>
              <FieldLabel htmlFor="automation-schedule">Schedule</FieldLabel>
              <Select
                items={[
                  { label: "No schedule", value: "none" },
                  { label: "Set a schedule", value: "scheduled" },
                ]}
                value={value.schedule ? "scheduled" : "none"}
                onValueChange={(next) => {
                  if (next === "none" && value.schedule) {
                    setConfirmScheduleRemoval(true);
                    return;
                  }
                  setSchedule(
                    next === "scheduled"
                      ? (value.schedule?.cron ?? "0 9 * * *")
                      : "",
                  );
                }}
              >
                <SelectTrigger id="automation-schedule" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No schedule</SelectItem>
                  <SelectItem value="scheduled">Set a schedule</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {value.schedule && (
              <>
                <Field
                  data-invalid={Boolean(form.formState.errors.schedule?.cron)}
                >
                  <CronExpressionInput
                    value={value.schedule.cron}
                    onChange={setSchedule}
                  />
                  {form.formState.errors.schedule?.cron && (
                    <FieldError>
                      {form.formState.errors.schedule.cron.message}
                    </FieldError>
                  )}
                </Field>
                <Controller
                  name="schedule.timezone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="automation-timezone">
                        Timezone (IANA)
                      </FieldLabel>
                      <Input
                        {...field}
                        id="automation-timezone"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="schedule.enabled"
                  control={form.control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Checkbox
                        id="automation-enabled"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <FieldLabel htmlFor="automation-enabled">
                        Schedule enabled
                      </FieldLabel>
                    </Field>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Save to calculate the next three occurrences.
                </p>
              </>
            )}
          </FieldSet>
        </FieldGroup>
      </form>
      <div
        className={
          inline
            ? "flex flex-wrap justify-end gap-2 border-t pt-4"
            : "flex flex-wrap justify-end gap-2"
        }
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="automation-form"
          disabled={saving || !form.formState.isValid}
        >
          {saving ? "Saving…" : "Save automation"}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmScheduleRemoval}
        onOpenChange={setConfirmScheduleRemoval}
        title="Remove this schedule?"
        description="This automation will no longer run automatically. You can still run it manually at any time."
        confirmLabel="Remove schedule"
        cancelLabel="Keep schedule"
        onConfirm={() => setSchedule("")}
      />
    </div>
  );

  if (inline) return formContent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
