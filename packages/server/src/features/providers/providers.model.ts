import { z } from "zod";

const metadataSchema = z.record(z.string(), z.unknown()).optional();

const modelCapabilitiesSchema = z
  .object({
    streaming: z.boolean().optional(),
    tools: z.boolean().optional(),
    reasoning: z.boolean().optional(),
    vision: z.boolean().optional(),
    attachments: z.boolean().optional(),
    structuredOutput: z.boolean().optional(),
    maxInputTokens: z.number().optional(),
    maxOutputTokens: z.number().optional(),
  })
  .optional();

const modelSchema = z.object({
  providerId: z.string(),
  modelId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  capabilities: modelCapabilitiesSchema,
  metadata: metadataSchema,
});

const agentSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  mode: z.enum(["primary", "subagent", "all"]).optional(),
  native: z.boolean().optional(),
  hidden: z.boolean().optional(),
  metadata: metadataSchema,
});

const providerCapabilitiesSchema = z.object({
  streaming: z.boolean(),
  approvals: z.boolean().optional(),
  questions: z.boolean().optional(),
  attachments: z.boolean().optional(),
  tools: z.boolean().optional(),
  reasoning: z.boolean().optional(),
  models: z.boolean().optional(),
  agents: z.boolean().optional(),
});

const providerSchema = z.object({
  id: z.string(),
  name: z.string(),
  capabilities: providerCapabilitiesSchema,
  models: z.array(modelSchema).optional(),
  agents: z.array(agentSchema).optional(),
  metadata: metadataSchema,
});

export const ProvidersModel = {
  providerSchema,
  providersSchema: z.array(providerSchema),
  eventsQuerySchema: z.object({
    directory: z.string().optional(),
    sessionId: z.string().optional(),
  }),
  eventSchema: z.object({
    type: z.string(),
    providerId: z.string(),
  }),
  sessionsQuerySchema: z.object({
    directory: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
  sessionParamSchema: z.object({ sessionId: z.string().min(1) }),
  messagesQuerySchema: z.object({
    directory: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    before: z.string().optional(),
  }),
  sessionInputSchema: z.object({
    directory: z.string().optional(),
    parentId: z.string().optional(),
    title: z.string().optional(),
    agentId: z.string().optional(),
    model: z.object({ providerId: z.string(), modelId: z.string() }).optional(),
    metadata: metadataSchema,
    messageId: z.string().optional(),
  }),
  messageInputSchema: z.object({
    sessionId: z.string().min(1),
    directory: z.string().optional(),
    content: z.string(),
    attachments: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string(),
          mimeType: z.string().optional(),
          size: z.number().optional(),
          url: z.string().optional(),
          data: z.unknown().optional(),
        }),
      )
      .optional(),
    model: z.object({ providerId: z.string(), modelId: z.string() }).optional(),
    agentId: z.string().optional(),
    metadata: metadataSchema,
  }),
  interactionInputSchema: z.object({
    kind: z.enum(["permission", "question"]).optional(),
    sessionId: z.string().optional().default(""),
    interactionId: z.string().min(1),
    directory: z.string().optional(),
    value: z.unknown(),
  }),
  permissionsQuerySchema: z.object({ directory: z.string().optional() }),
  questionsQuerySchema: z.object({
    directory: z.string().optional(),
    sessionId: z.string().optional(),
  }),
  filesQuerySchema: z.object({
    directory: z.string().min(1),
    path: z.string().min(1),
  }),
  fileReadQuerySchema: z.object({
    directory: z.string().min(1),
    path: z.string().min(1),
  }),
  fileSearchQuerySchema: z.object({
    directory: z.string().min(1),
    query: z.string(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
  diffQuerySchema: z.object({ directory: z.string().min(1) }),
  commandsQuerySchema: z.object({ directory: z.string().min(1) }),
};

export type ProviderDto = z.infer<typeof providerSchema>;
