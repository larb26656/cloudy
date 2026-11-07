import { useId, useState } from "react";
import { HelpCircle } from "lucide-react";
import { z } from "zod";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet";
import { toast } from "@repo/ui/components/sonner";
import { useReplyQuestion } from "@/hooks/queries/useQuestions";
import type { QuestionRequest } from "@/types";

type Option = { const: string; title: string; description?: string | null };
type Property = {
  type: string;
  title?: string | null;
  description?: string | null;
  default?: unknown;
  enum?: string[] | null;
  oneOf?: Option[] | null;
  items?: { enum?: string[]; anyOf?: Option[] };
  minLength?: number | null;
  maxLength?: number | null;
  pattern?: string | null;
  format?: string | null;
  minimum?: number | null;
  maximum?: number | null;
  minItems?: number | null;
  maxItems?: number | null;
};
type Schema = {
  properties: Record<string, Property>;
  required?: string[] | null;
};
type Values = Record<string, unknown>;

function optionsFor(property: Property): Option[] | undefined {
  const source = property.type === "array" ? property.items : property;
  if (!source) return undefined;
  const titled =
    "anyOf" in source
      ? source.anyOf
      : "oneOf" in source
        ? source.oneOf
        : undefined;
  if (titled != null) {
    return source.enum == null
      ? titled
      : titled.filter((option) => source.enum?.includes(option.const));
  }
  return source.enum?.map((value) => ({ const: value, title: value }));
}

function validate(
  property: Property,
  value: unknown,
  required: boolean,
): string | undefined {
  if (value === undefined)
    return required ? "This field is required." : undefined;
  if (property.type === "string" && typeof value === "string") {
    if (property.minLength != null && [...value].length < property.minLength)
      return `Enter at least ${property.minLength} characters.`;
    if (property.maxLength != null && [...value].length > property.maxLength)
      return `Enter no more than ${property.maxLength} characters.`;
    if (property.pattern != null) {
      try {
        if (!new RegExp(property.pattern, "u").test(value))
          return "Use the requested format.";
      } catch {
        return "The requested pattern is invalid.";
      }
    }
    if (
      property.format === "email" &&
      !z.string().email().safeParse(value).success
    )
      return "Enter a valid email address.";
    if (property.format === "uri" && !z.string().url().safeParse(value).success)
      return "Enter a valid URI.";
    if (
      property.format === "date" &&
      !z.string().date().safeParse(value).success
    )
      return "Enter a valid date (YYYY-MM-DD).";
    if (
      property.format === "date-time" &&
      !z.string().datetime({ offset: true }).safeParse(value).success
    )
      return "Enter a valid date and time with a timezone.";
    const options = optionsFor(property);
    if (options && !options.some((option) => option.const === value))
      return "Choose an available option.";
    return undefined;
  }
  if (
    (property.type === "number" || property.type === "integer") &&
    typeof value === "number"
  ) {
    if (!Number.isFinite(value)) return "Enter a valid number.";
    if (property.type === "integer" && !Number.isInteger(value))
      return "Enter a whole number.";
    if (property.minimum != null && value < property.minimum)
      return `Enter a value of at least ${property.minimum}.`;
    if (property.maximum != null && value > property.maximum)
      return `Enter a value no greater than ${property.maximum}.`;
    return undefined;
  }
  if (property.type === "boolean" && typeof value === "boolean")
    return undefined;
  if (property.type === "array" && Array.isArray(value)) {
    if (property.minItems != null && value.length < property.minItems)
      return `Select at least ${property.minItems} options.`;
    if (property.maxItems != null && value.length > property.maxItems)
      return `Select no more than ${property.maxItems} options.`;
    const options = optionsFor(property) ?? [];
    if (value.some((item) => !options.some((option) => option.const === item)))
      return "Choose only available options.";
    return undefined;
  }
  return "Enter a valid value.";
}

export function FormQuestionSheet({
  open,
  onOpenChange,
  question,
  form,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: QuestionRequest;
  form: NonNullable<QuestionRequest["form"]>;
}) {
  const schema = form.schema as Schema;
  const fields = Object.entries(schema.properties);
  const [values, setValues] = useState<Values>(() =>
    Object.fromEntries(
      fields
        .filter(([, property]) => property.default != null)
        .map(([key, property]) => [key, property.default]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const id = useId();
  const reply = useReplyQuestion();

  function change(key: string, value: unknown) {
    setValues((previous) => {
      const next = { ...previous };
      if (value === undefined) delete next[key];
      else
        Object.defineProperty(next, key, {
          value,
          enumerable: true,
          configurable: true,
          writable: true,
        });
      return next;
    });
    setErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  async function respond(action: "accept" | "decline" | "cancel") {
    if (action === "accept") {
      const nextErrors = Object.fromEntries(
        fields.flatMap(([key, property]) => {
          const error = validate(
            property,
            Object.hasOwn(values, key) ? values[key] : undefined,
            schema.required?.includes(key) ?? false,
          );
          return error ? [[key, error]] : [];
        }),
      );
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
    }
    try {
      await reply.mutateAsync({
        requestID: question.id,
        sessionId: question.sessionID,
        value: action === "accept" ? { action, content: values } : { action },
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to respond to question",
      );
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-w-lg mx-auto rounded-t-xl max-h-dvh"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="size-4 text-amber-600" />
            Question from {form.agent}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <p className="mb-5 whitespace-pre-wrap text-sm">{form.message}</p>
          <FieldGroup>
            {fields.map(([key, property], index) => {
              const fieldId = `${id}-${index}`;
              const error = Object.hasOwn(errors, key)
                ? errors[key]
                : undefined;
              const required = schema.required?.includes(key) ?? false;
              const title = `${property.title ?? key}${required ? " (required)" : " (optional)"}`;
              const options = optionsFor(property);
              const value = Object.hasOwn(values, key)
                ? values[key]
                : undefined;
              const describedBy =
                [
                  property.description ? `${fieldId}-description` : "",
                  error ? `${fieldId}-error` : "",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined;
              if (property.type === "boolean" || options) {
                const choices: Option[] =
                  property.type === "boolean"
                    ? [
                        { const: "true", title: "Yes" },
                        { const: "false", title: "No" },
                      ]
                    : (options ?? []);
                return (
                  <FieldSet
                    key={key}
                    aria-describedby={describedBy}
                    aria-invalid={!!error}
                  >
                    <FieldLegend variant="label">{title}</FieldLegend>
                    {property.description && (
                      <FieldDescription id={`${fieldId}-description`}>
                        {property.description}
                      </FieldDescription>
                    )}
                    {property.type === "array" ? (
                      <div className="flex flex-col gap-3">
                        {choices.map((option, optionIndex) => {
                          const selected = Array.isArray(value)
                            ? (value as string[])
                            : [];
                          const optionId = `${fieldId}-${optionIndex}`;
                          return (
                            <Field key={option.const} orientation="horizontal">
                              <Checkbox
                                id={optionId}
                                checked={selected.includes(option.const)}
                                disabled={reply.isPending}
                                onCheckedChange={(checked) =>
                                  change(
                                    key,
                                    checked
                                      ? [...selected, option.const]
                                      : selected.filter(
                                          (item) => item !== option.const,
                                        ),
                                  )
                                }
                              />
                              <FieldLabel htmlFor={optionId}>
                                {option.title}
                                {option.description &&
                                  ` — ${option.description}`}
                              </FieldLabel>
                            </Field>
                          );
                        })}
                      </div>
                    ) : (
                      <RadioGroup
                        value={
                          value === undefined
                            ? ""
                            : String(
                                choices.findIndex(
                                  (option) => option.const === String(value),
                                ) + 1,
                              )
                        }
                        onValueChange={(selected) => {
                          const choice = choices[Number(selected) - 1];
                          if (choice)
                            change(
                              key,
                              property.type === "boolean"
                                ? choice.const === "true"
                                : choice.const,
                            );
                        }}
                      >
                        {choices.map((option, optionIndex) => {
                          const optionId = `${fieldId}-${optionIndex}`;
                          return (
                            <Field key={option.const} orientation="horizontal">
                              <RadioGroupItem
                                id={optionId}
                                value={String(optionIndex + 1)}
                                disabled={reply.isPending}
                              />
                              <FieldLabel htmlFor={optionId}>
                                {option.title}
                                {option.description &&
                                  ` — ${option.description}`}
                              </FieldLabel>
                            </Field>
                          );
                        })}
                      </RadioGroup>
                    )}
                    {property.type === "array" && value === undefined && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => change(key, [])}
                        disabled={reply.isPending}
                      >
                        Select none
                      </Button>
                    )}
                    {property.type === "array" &&
                      Array.isArray(value) &&
                      value.length === 0 && (
                        <FieldDescription>
                          No options selected.
                        </FieldDescription>
                      )}
                    {!required && value !== undefined && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => change(key, undefined)}
                        disabled={reply.isPending}
                      >
                        Clear answer
                      </Button>
                    )}
                    {error && (
                      <FieldError id={`${fieldId}-error`}>{error}</FieldError>
                    )}
                  </FieldSet>
                );
              }
              if (
                property.type !== "string" &&
                property.type !== "number" &&
                property.type !== "integer"
              ) {
                return (
                  <Field key={key}>
                    <FieldLabel>{title}</FieldLabel>
                    <FieldDescription>
                      This field type is not supported.
                    </FieldDescription>
                  </Field>
                );
              }
              return (
                <Field key={key} data-invalid={!!error}>
                  <FieldLabel htmlFor={fieldId}>{title}</FieldLabel>
                  <Input
                    id={fieldId}
                    type={
                      property.type === "number" || property.type === "integer"
                        ? "number"
                        : "text"
                    }
                    step={
                      property.type === "integer"
                        ? 1
                        : property.type === "number"
                          ? "any"
                          : undefined
                    }
                    value={value === undefined ? "" : String(value)}
                    onChange={(event) =>
                      change(
                        key,
                        property.type === "number" ||
                          property.type === "integer"
                          ? event.target.value === ""
                            ? undefined
                            : event.target.valueAsNumber
                          : event.target.value,
                      )
                    }
                    disabled={reply.isPending}
                    aria-invalid={!!error}
                    aria-describedby={describedBy}
                  />
                  {property.description && (
                    <FieldDescription id={`${fieldId}-description`}>
                      {property.description}
                    </FieldDescription>
                  )}
                  {!required && value !== undefined && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => change(key, undefined)}
                      disabled={reply.isPending}
                    >
                      Clear answer
                    </Button>
                  )}
                  {error && (
                    <FieldError id={`${fieldId}-error`}>{error}</FieldError>
                  )}
                </Field>
              );
            })}
          </FieldGroup>
        </div>
        <SheetFooter className="shrink-0">
          <div className="flex w-full flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={() => respond("decline")}
              disabled={reply.isPending}
            >
              Decline
            </Button>
            <Button
              variant="outline"
              onClick={() => respond("cancel")}
              disabled={reply.isPending}
            >
              Cancel question
            </Button>
            <Button
              className="flex-1"
              onClick={() => respond("accept")}
              disabled={reply.isPending}
            >
              Submit answer
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
