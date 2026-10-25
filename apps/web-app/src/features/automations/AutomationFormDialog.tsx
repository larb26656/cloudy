import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  values: AutomationInput;
  isEditing: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AutomationInput) => void;
}) {
  const { data: providers = [] } = useModels();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-4 overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit automation" : "New automation"}
          </DialogTitle>
          <DialogDescription>
            Configure the prompt, agent, working directory, and optional
            schedule.
          </DialogDescription>
        </DialogHeader>
        <form
          id="automation-form"
          onSubmit={form.handleSubmit((data) =>
            onSubmit(data as AutomationInput),
          )}
          className="min-h-0 overflow-y-auto"
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
                    className="min-h-32"
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
              <ProviderSelector
                providerId={value.providerInstanceId}
                triggerAriaLabel="Provider instance"
                onChange={(providerInstanceId) => {
                  form.setValue("providerInstanceId", providerInstanceId, {
                    shouldValidate: true,
                  });
                  form.setValue("agentId", undefined);
                  form.setValue("model", undefined);
                }}
                filterProviders={(item) =>
                  !item.capabilities.approvals && !item.capabilities.questions
                }
                triggerClassName="h-9 w-full justify-between rounded-md border px-3 text-sm"
              />
            </Field>
            {provider?.capabilities.agents && (
              <Field>
                <FieldLabel>Agent</FieldLabel>
                <AgentSelector
                  providerId={value.providerInstanceId}
                  value={value.agentId ?? null}
                  onChange={(agentId) =>
                    form.setValue("agentId", agentId ?? undefined)
                  }
                  triggerClassName="h-9 w-full justify-between rounded-md border px-3 text-sm"
                />
              </Field>
            )}
            {provider?.capabilities.models && (
              <Controller
                name="model"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="automation-model">Model</FieldLabel>
                    <Select
                      value={
                        field.value
                          ? `${field.value.providerId}/${field.value.modelId}`
                          : "default"
                      }
                      onValueChange={(next) => {
                        const model = models.find(
                          (item) =>
                            `${item.providerId}/${item.modelId}` === next,
                        );
                        field.onChange(
                          model
                            ? {
                                providerId: model.providerId,
                                modelId: model.modelId,
                              }
                            : undefined,
                        );
                      }}
                    >
                      <SelectTrigger id="automation-model" className="w-full">
                        <SelectValue placeholder="Provider default" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          Provider default
                        </SelectItem>
                        {models.map((model) => (
                          <SelectItem
                            key={`${model.providerId}/${model.modelId}`}
                            value={`${model.providerId}/${model.modelId}`}
                          >
                            {model.name ?? model.modelId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                <select
                  id="automation-schedule"
                  aria-label="Schedule"
                  className="h-9 rounded-md border bg-background px-3"
                  value={value.schedule ? "scheduled" : "none"}
                  onChange={(event) =>
                    setSchedule(
                      event.target.value === "scheduled"
                        ? (value.schedule?.cron ?? "0 9 * * *")
                        : "",
                    )
                  }
                >
                  <option value="none">No schedule</option>
                  <option value="scheduled">Set a schedule</option>
                </select>
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
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
