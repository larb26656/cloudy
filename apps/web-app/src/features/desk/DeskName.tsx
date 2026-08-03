import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

interface DeskNameProps {
  name: string;
  onNameChange: (name: string) => void;
}

const editDeskNameFormSchema = z.object({
  name: z.string(),
});

export type EditDeskNameFormSchemaValues = z.infer<
  typeof editDeskNameFormSchema
>;

export function DeskName({ name, onNameChange }: DeskNameProps) {
  const [editMode, setEditMode] = useState(false);
  const form = useForm<EditDeskNameFormSchemaValues>({
    resolver: zodResolver(editDeskNameFormSchema),
    defaultValues: {
      name: name,
    },
  });

  const onSubmit = (data: EditDeskNameFormSchemaValues) => {
    setEditMode(false);
    if (data.name !== name) {
      onNameChange(data.name);
    }
  };

  return (
    <Card size="sm">
      <CardContent>
        {!editMode ? (
          <button
            onClick={() => {
              setEditMode(true);
            }}
          >
            Name: {name}
          </button>
        ) : (
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Input
                  {...field}
                  onBlur={() => {
                    field.onBlur();
                    form.handleSubmit(onSubmit)();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)();
                      e.currentTarget.blur();
                    }
                  }}
                  id="desk-name"
                  aria-invalid={fieldState.invalid}
                  placeholder="desk name"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}
