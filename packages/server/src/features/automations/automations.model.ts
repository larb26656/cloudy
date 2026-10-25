import { z } from "zod";

export const cronExpressionSchema = z.string().refine(isValidCron, {
  message: "Expected a valid five-field cron expression",
});

function isValidCron(value: string) {
  const fields = value.trim().split(/\s+/);
  const limits = [59, 23, 31, 12, 7];
  const minimums = [0, 0, 1, 1, 0];
  return (
    fields.length === 5 &&
    fields.every((field, index) => {
      const max = limits[index]!;
      return field.split(",").every((part) => {
        const [range, step] = part.split("/");
        if (step !== undefined && (!/^\d+$/.test(step) || Number(step) < 1))
          return false;
        if (range === "*") return true;
        const endpoints = range!.split("-");
        return (
          endpoints.length <= 2 &&
          endpoints.every(
            (endpoint) =>
              /^\d+$/.test(endpoint) &&
              Number(endpoint) >= minimums[index]! &&
              Number(endpoint) <= max,
          ) &&
          (endpoints.length === 1 ||
            Number(endpoints[0]) <= Number(endpoints[1]))
        );
      });
    })
  );
}

const scheduleSchema = z.object({
  cron: cronExpressionSchema,
  timezone: z.string().refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Expected a valid IANA timezone"),
  enabled: z.boolean().default(false),
});

const automationFieldsSchema = z.object({
  name: z.string().min(1),
  prompt: z.string().min(1),
  providerInstanceId: z.string().min(1),
  agentId: z.string().optional(),
  model: z.object({ providerId: z.string(), modelId: z.string() }).optional(),
  directoryMode: z.enum(["temp", "specified"]),
  directoryPath: z.string().optional(),
  schedule: scheduleSchema.optional(),
});

export const automationCreateSchema = automationFieldsSchema.refine(
  (value) =>
    value.directoryMode !== "specified" || !!value.directoryPath?.trim(),
  {
    message: "A directory path is required for specified directory mode",
    path: ["directoryPath"],
  },
);

export const automationUpdateSchema = automationFieldsSchema.partial();
export const automationIdSchema = z.object({ id: z.string().min(1) });
export const runParamSchema = automationIdSchema.extend({
  runId: z.string().uuid(),
});
export const startRunSchema = z.object({});
export const automationSchema = automationCreateSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const runSchema = z.object({
  id: z.string(),
  automationId: z.string(),
  trigger: z.enum(["manual", "schedule"]),
  scheduledFor: z.string().nullable(),
  state: z.enum([
    "pending",
    "running",
    "succeeded",
    "failed",
    "skipped",
    "interrupted",
  ]),
  phase: z.enum(["working", "send_to_log"]).nullable(),
  sessionId: z.string().nullable(),
  output: z.string().nullable(),
  error: z.string().nullable(),
  reason: z.string().nullable(),
  configSnapshot: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
});
export const schedulePreviewSchema = z.object({
  occurrences: z.array(z.string().datetime()),
});

export const AutomationsModel = {
  automationCreateSchema,
  automationUpdateSchema,
  automationIdSchema,
  runParamSchema,
  startRunSchema,
  automationSchema,
  runSchema,
  schedulePreviewSchema,
} as const;
export type AutomationInput = z.infer<typeof automationCreateSchema>;
export type AutomationUpdateInput = z.infer<typeof automationUpdateSchema>;
