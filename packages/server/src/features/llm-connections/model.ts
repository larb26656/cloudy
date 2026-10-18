import { z } from "zod";

const configSchema = z.record(z.string(), z.unknown());
const connectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  config: configSchema,
  secretsConfigured: z.record(z.string(), z.boolean()),
  modelIds: z.array(z.string()),
});

export const LLMConnectionModel = {
  connectionSchema,
  settingsSchema: z.object({
    providerTypes: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        configFields: z.array(
          z.object({
            key: z.string(),
            label: z.string(),
            type: z.enum(["text", "url", "secret"]),
            required: z.boolean().optional(),
          }),
        ),
      }),
    ),
    connections: z.array(connectionSchema),
    default: z
      .object({ connectionId: z.string(), modelId: z.string() })
      .nullable(),
  }),
  createConnectionSchema: z.object({
    name: z.string().trim().min(1),
    type: z.string().min(1),
    config: configSchema,
    modelIds: z.array(z.string().trim().min(1)).min(1),
  }),
  updateConnectionSchema: z.object({
    name: z.string().trim().min(1).optional(),
    config: configSchema.optional(),
    modelIds: z.array(z.string().trim().min(1)).min(1).optional(),
  }),
  defaultSchema: z.object({
    connectionId: z.string().min(1),
    modelId: z.string().min(1),
  }),
};

export type LLMConnectionInput = z.infer<
  typeof LLMConnectionModel.createConnectionSchema
>;
export type LLMConnectionDto = z.infer<typeof connectionSchema>;
