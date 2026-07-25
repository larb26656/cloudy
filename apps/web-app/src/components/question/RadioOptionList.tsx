import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "../ui/card";
import { Input } from "@/components/ui/input";
import { FieldError } from "../ui/field";
import { useMemo } from "react";
import { useController, type UseControllerProps } from "react-hook-form";
import type { QuestionFormValues } from "./QuestionSheet";

interface Option {
  label: string;
  description?: string;
  isOther?: boolean;
}

type RadioOptionListProps = {
  options: Option[];
  disabled?: boolean;
} & UseControllerProps<QuestionFormValues, `answers.${number}`>;

export function RadioOptionList({
  options,
  disabled,
  ...controllerProps
}: RadioOptionListProps) {
  const {
    field: { value, onChange },
    fieldState,
  } = useController(controllerProps);

  const answer = value as { value: string; otherText?: string } | undefined;
  const selected = answer?.value ?? "";
  const otherText = answer?.otherText ?? "";

  const newOptions = useMemo<Option[]>(
    () => [...options, { label: "other", isOther: true }],
    [options],
  );

  const handleValueChange = (newValue: string) => {
    onChange({
      type: "single",
      value: newValue,
      otherText,
    });
  };

  const handleOtherTextChange = (text: string) => {
    onChange({
      type: "single",
      value: selected,
      otherText: text,
    });
  };

  const zodError = fieldState.error as
    | { value?: { message: string }; otherText?: { message: string } }
    | undefined;
  const errorValue = zodError?.value;
  const errorOtherText = zodError?.otherText;

  return (
    <RadioGroup
      value={selected}
      onValueChange={handleValueChange}
      disabled={disabled}
      className="flex flex-col gap-4"
    >
      {newOptions.map((opt, optIdx) => (
        <label key={optIdx} className="cursor-pointer">
          <Card>
            <CardContent className="flex items-start gap-2">
              <RadioGroupItem value={opt.label} />

              <div className="flex-1">
                <span className="text-sm font-medium">
                  {opt.isOther ? "Other" : opt.label}
                </span>

                {opt.description && (
                  <span className="text-xs text-muted-foreground ml-1">
                    — {opt.description}
                  </span>
                )}

                {opt.isOther && selected === "other" && (
                  <div className="mt-2">
                    <Input
                      value={otherText}
                      onChange={(e) => handleOtherTextChange(e.target.value)}
                      placeholder="Please specify"
                      disabled={disabled}
                      aria-invalid={!!errorOtherText}
                    />
                    {errorOtherText && <FieldError errors={[errorOtherText]} />}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </label>
      ))}
      {errorValue ? <FieldError errors={[errorValue]} /> : null}
    </RadioGroup>
  );
}
