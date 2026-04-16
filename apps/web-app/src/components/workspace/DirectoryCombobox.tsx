import { useState, useRef } from "react";
import { Controller, type FieldErrors } from "react-hook-form";
import type { Control, FieldValues } from "react-hook-form";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { getOC } from "@/stores/instance/instanceScopeHook";

async function searchDirectories(
  instanceId: string,
  query: string
): Promise<string[]> {
  const oc = getOC(instanceId);
  const result = await oc.find.files({
    query,
    type: "directory",
    limit: 10,
  });
  return result.data ?? [];
}

interface DirectoryComboboxProps<T extends FieldValues = FieldValues> {
  instanceId: string | undefined;
  control: Control<T>;
  errors: FieldErrors<T>;
}

export function DirectoryCombobox<T extends FieldValues>({
  instanceId,
  control,
  errors,
}: DirectoryComboboxProps<T>) {
  return (
    <DirectoryComboboxInner
      instanceId={instanceId}
      control={control as Control<FieldValues>}
      errors={errors as FieldErrors<FieldValues>}
    />
  );
}

function DirectoryComboboxInner({
  instanceId,
  control,
  errors,
}: {
  instanceId: string | undefined;
  control: Control<FieldValues>;
  errors: FieldErrors<FieldValues>;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <Controller
      name="directory"
      control={control}
      render={({ field }) => (
        <Field data-invalid={!!errors.directory}>
          <FieldLabel htmlFor="workspace-directory" className="required">
            Directory
          </FieldLabel>
          <Combobox
            items={suggestions}
            value={field.value}
            open={open}
            onOpenChange={setOpen}
            onValueChange={(value) => {
              if (value) {
                field.onChange(value);
                setOpen(false);
              }
            }}
            onInputValueChange={(inputValue) => {
              field.onChange(inputValue);
              if (!inputValue.trim() || !instanceId) {
                setSuggestions([]);
                return;
              }
              if (debounceRef.current) {
                clearTimeout(debounceRef.current);
              }
              debounceRef.current = setTimeout(async () => {
                const results = await searchDirectories(instanceId, inputValue);
                setSuggestions(results);
              }, 300);
            }}
          >
            <ComboboxInput
              id="workspace-directory"
              placeholder="/path/to/project"
              aria-invalid={!!errors.directory}
            />
            <ComboboxContent>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item ?? ""}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
              {(field.value as string | null | undefined)?.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    field.onChange(field.value);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-t"
                >
                  Use: <span className="font-mono">{field.value as string}</span>
                </button>
              )}
            </ComboboxContent>
          </Combobox>
          {errors.directory && <FieldError errors={[errors.directory]} />}
        </Field>
      )}
    />
  );
}
