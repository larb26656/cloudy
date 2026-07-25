import { Checkbox } from "@/components/ui/checkbox";
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

type CheckboxOptionListProps = {
  options: Option[];
  disabled?: boolean;
} & UseControllerProps<QuestionFormValues, `answers.${number}`>;

export function CheckboxOptionList({
  options,
  disabled,
  ...controllerProps
}: CheckboxOptionListProps) {
  const {
    field: { value, onChange },
    fieldState,
  } = useController(controllerProps);

  const answer = value as { values: string[]; otherText?: string } | undefined;
  const selected = answer?.values ?? [];
  const otherText = answer?.otherText ?? "";

  const newOptions = useMemo<Option[]>(
    () => [...options, { label: "other", isOther: true }],
    [options],
  );

  const handleCheckedChange = (checked: boolean, label: string) => {
    const newValues = checked
      ? [...new Set([...selected, label])]
      : selected.filter((v) => v !== label);
    onChange({
      type: "multiple",
      values: newValues,
      otherText,
    });
  };

  const handleOtherTextChange = (text: string) => {
    onChange({
      type: "multiple",
      values: selected,
      otherText: text,
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorValues = fieldState.error
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fieldState.error as any).values
    : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorOtherText = fieldState.error
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fieldState.error as any).otherText
    : null;

  return (
    <div className="flex flex-col gap-4">
      {newOptions.map((opt, optIdx) => {
        const isChecked = selected.includes(opt.label);

        return (
          <label className="cursor-pointer" key={optIdx}>
            <Card>
              <CardContent className="flex items-start gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    handleCheckedChange(checked as boolean, opt.label)
                  }
                  disabled={disabled}
                />

                <div className="flex-1">
                  <span className="text-sm font-medium">
                    {opt.isOther ? "Other" : opt.label}
                  </span>

                  {opt.description && (
                    <span className="text-xs text-muted-foreground ml-1">
                      — {opt.description}
                    </span>
                  )}

                  {opt.isOther && isChecked && (
                    <div className="mt-2">
                      <Input
                        value={otherText}
                        onChange={(e) => handleOtherTextChange(e.target.value)}
                        placeholder="Please specify"
                        disabled={disabled}
                        aria-invalid={!!errorOtherText}
                      />
                      {errorOtherText && (
                        <FieldError errors={[errorOtherText]} />
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </label>
        );
      })}
      {errorValues && <FieldError errors={[errorValues]} />}
    </div>
  );
}
