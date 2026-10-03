import { z } from "zod";

const providerSettingsSchema = z.object({
  enabled: z.boolean(),
  baseUrl: z.string().url(),
});

export const SettingsModel = {
  providerSettingsSchema,
  providersSchema: z.object({ opencode: providerSettingsSchema }),
};

export type ProviderSettings = z.infer<typeof providerSettingsSchema>;
