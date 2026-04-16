import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchSelect from "@/components/ui/search-select";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ColorPicker } from "@/components/ui/color-picker/ColorPicker";
import { WORKSPACE_COLORS } from "@/stores/workspaceStore";
import { useInstanceStore } from "@/stores/instanceStore";
import { DirectoryCombobox } from "./DirectoryCombobox";
import { workspaceSchema, type WorkspaceFormData } from "./workspaceSchema";

interface WorkspaceFormProps {
  defaultValues: WorkspaceFormData;
  onSubmit: (data: WorkspaceFormData) => void;
  submitLabel: string;
  isSubmitting?: boolean;
}

export function WorkspaceForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting = false,
}: WorkspaceFormProps) {
  const { instances } = useInstanceStore();

  const {
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues,
  });

  const selectedInstanceId = watch("instanceId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FieldGroup>
        <Controller
          name="instanceId"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="workspace-instance" className="requied">
                Instance
              </FieldLabel>
              <SearchSelect
                items={instances.map((i) => ({ value: i.id, label: i.name }))}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select instance"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="workspace-name" className="required">
                Name
              </FieldLabel>
              <Input
                {...field}
                id="workspace-name"
                placeholder="My Workspace"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <DirectoryCombobox
          instanceId={selectedInstanceId}
          control={control}
          errors={errors}
        />

        <Field>
          <FieldLabel className="required">Color</FieldLabel>
          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <ColorPicker
                value={field.value}
                onChange={field.onChange}
                colors={WORKSPACE_COLORS}
                columns={4}
                size="md"
              />
            )}
          />
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? submitLabel + "..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
