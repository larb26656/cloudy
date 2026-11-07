import * as acp from "@agentclientprotocol/sdk";
import { z } from "zod";
import { ValidationError } from "../../shared/domain-error";

export function validateFormResponse(
  schema: acp.ElicitationSchema,
  value: unknown,
): acp.CreateElicitationResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("action" in value)
  )
    throw new ValidationError("Invalid ACP question response");
  if (value.action === "decline" || value.action === "cancel")
    return { action: value.action };
  if (
    value.action !== "accept" ||
    !("content" in value) ||
    typeof value.content !== "object" ||
    value.content === null ||
    Array.isArray(value.content)
  )
    throw new ValidationError("ACP question acceptance requires form content");

  const content = value.content as Record<string, unknown>;
  const properties = schema.properties ?? {};
  for (const key of schema.required ?? []) {
    if (!Object.hasOwn(content, key))
      throw new ValidationError(`Required form field missing: ${key}`);
  }
  for (const [key, answer] of Object.entries(content)) {
    const field = Object.hasOwn(properties, key) ? properties[key] : undefined;
    if (!field || !validField(field, answer))
      throw new ValidationError(`Invalid form field: ${key}`);
  }
  return {
    action: "accept",
    content: content as Record<string, acp.ElicitationContentValue>,
  };
}

function validField(
  field: acp.ElicitationPropertySchema,
  value: unknown,
): boolean {
  if (acp.ElicitationPropertySchema.isString(field)) {
    if (typeof value !== "string") return false;
    const length = [...value].length;
    if (
      (field.minLength != null && length < field.minLength) ||
      (field.maxLength != null && length > field.maxLength)
    )
      return false;
    if (field.enum != null && !field.enum.includes(value)) return false;
    if (
      field.oneOf != null &&
      !field.oneOf.some((option) => option.const === value)
    )
      return false;
    if (field.pattern != null) {
      try {
        if (!new RegExp(field.pattern, "u").test(value)) return false;
      } catch {
        return false;
      }
    }
    if (field.format === "email" && !z.email().safeParse(value).success)
      return false;
    if (field.format === "uri" && !z.url().safeParse(value).success)
      return false;
    if (field.format === "date" && !z.iso.date().safeParse(value).success)
      return false;
    if (
      field.format === "date-time" &&
      !z.iso.datetime({ offset: true }).safeParse(value).success
    )
      return false;
    return true;
  }
  if (
    acp.ElicitationPropertySchema.isNumber(field) ||
    acp.ElicitationPropertySchema.isInteger(field)
  ) {
    return (
      typeof value === "number" &&
      Number.isFinite(value) &&
      (field.type !== "integer" || Number.isInteger(value)) &&
      (field.minimum == null || value >= field.minimum) &&
      (field.maximum == null || value <= field.maximum)
    );
  }
  if (acp.ElicitationPropertySchema.isBoolean(field))
    return typeof value === "boolean";
  if (acp.ElicitationPropertySchema.isArray(field)) {
    if (
      !Array.isArray(value) ||
      (field.minItems != null && value.length < field.minItems) ||
      (field.maxItems != null && value.length > field.maxItems)
    )
      return false;
    const items = field.items;
    const options = acp.MultiSelectItems.isString(items)
      ? items.enum
      : acp.MultiSelectItems.isTitled(items)
        ? items.anyOf.map((option) => option.const)
        : undefined;
    return (
      options !== undefined &&
      value.every((item) => typeof item === "string" && options.includes(item))
    );
  }
  return false;
}
