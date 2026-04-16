import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getOC } from "@/stores/instance/instanceScopeHook";
import { Folder, Loader2 } from "lucide-react";
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

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues,
  });

  const selectedInstanceId = watch("instanceId");
  const directory = watch("directory");

  useEffect(() => {
    if (!directory.trim() || !selectedInstanceId) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const oc = getOC(selectedInstanceId);
        const result = await oc.find.files({
          query: directory,
          type: "directory",
          limit: 10,
        });
        setSuggestions(result.data ?? []);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [directory, selectedInstanceId]);

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
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="workspace-instance">
                  <SelectValue placeholder="Select instance" />
                </SelectTrigger>
                <SelectContent>
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        <Field data-invalid={!!errors.directory}>
          <FieldLabel htmlFor="workspace-directory" className="required">
            Directory
          </FieldLabel>
          <div className="relative">
            <div className="relative">
              <Folder className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                {...register("directory")}
                id="workspace-directory"
                placeholder="/path/to/project"
                className="pl-9"
                aria-invalid={!!errors.directory}
              />
            </div>
            {isSearching && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Searching...
              </div>
            )}
            {!isSearching && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-md max-h-[200px] overflow-auto">
                {suggestions.map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setValue("directory", dir)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <Folder className="size-4 shrink-0" />
                    <span className="truncate">{dir}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.directory && <FieldError errors={[errors.directory]} />}
        </Field>

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
