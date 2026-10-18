import { z } from "zod";

const agentProviderSettingsSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  templateId: z.literal("opencode"),
  enabled: z.boolean(),
  baseUrl: z.string().url(),
});
const createAgentProviderSchema = agentProviderSettingsSchema.omit({
  id: true,
});

export const SettingsModel = {
  agentProviderSettingsSchema,
  agentProvidersSchema: z.object({
    instances: z.array(agentProviderSettingsSchema),
  }),
  agentProviderTemplatesSchema: z.object({
    templates: z.array(
      z.object({
        id: z.literal("opencode"),
        name: z.string(),
        description: z.string(),
      }),
    ),
  }),
  createAgentProviderSchema,
  updateAgentProviderSchema: createAgentProviderSchema.partial(),
};

export type AgentProviderSettings = z.infer<typeof agentProviderSettingsSchema>;
