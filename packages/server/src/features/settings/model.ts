import { z } from "zod";

const providerSettingsSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  templateId: z.literal("opencode"),
  enabled: z.boolean(),
  baseUrl: z.string().url(),
});
const createProviderSchema = providerSettingsSchema.omit({ id: true });

export const SettingsModel = {
  providerSettingsSchema,
  providersSchema: z.object({ instances: z.array(providerSettingsSchema) }),
  providerTemplatesSchema: z.object({
    templates: z.array(
      z.object({
        id: z.literal("opencode"),
        name: z.string(),
        description: z.string(),
      }),
    ),
  }),
  createProviderSchema,
  updateProviderSchema: createProviderSchema.partial(),
};

export type ProviderSettings = z.infer<typeof providerSettingsSchema>;
