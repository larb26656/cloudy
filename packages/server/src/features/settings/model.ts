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
const agentSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  systemPrompt: z.string().optional(),
  builtIn: z.boolean(),
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
  createAgentSchema: agentSchema.omit({ id: true, builtIn: true }),
  updateAgentSchema: agentSchema.omit({ id: true, builtIn: true }).partial(),
};

export type AgentProviderSettings = z.infer<typeof agentProviderSettingsSchema>;
export type AgentConfig = z.infer<typeof agentSchema>;
