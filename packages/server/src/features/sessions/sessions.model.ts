import { z } from "zod";

const metadataSchema = z.record(z.string(), z.unknown()).optional();

export const sessionQuerySchema = z.object({
  directory: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const sessionParamSchema = z.object({ sessionId: z.string().uuid() });

export const createSessionSchema = z.object({
  providerId: z.string().min(1).default("opencode"),
  directory: z.string().optional(),
  parentId: z.string().uuid().optional(),
  title: z.string().optional(),
  agentId: z.string().optional(),
  model: z.object({ providerId: z.string(), modelId: z.string() }).optional(),
  metadata: metadataSchema,
});

export const updateSessionSchema = z.object({
  directory: z.string().optional(),
  title: z.string().optional(),
  metadata: metadataSchema,
});

export const messagesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  before: z.string().optional(),
});

export const messageInputSchema = z.object({
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
  model: z
    .object({
      providerId: z.string(),
      modelId: z.string(),
      variantId: z.string().optional(),
    })
    .optional(),
  agentId: z.string().optional(),
  metadata: metadataSchema,
});

export const commandInputSchema = z.object({
  command: z.string().min(1),
  arguments: z.string().optional(),
});

export const forkSessionSchema = z.object({ messageId: z.string().optional() });

export const questionParamSchema = sessionParamSchema.extend({
  questionId: z.string().min(1),
});

export const questionResponseSchema = z.object({ value: z.unknown() });

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type MessageInput = z.infer<typeof messageInputSchema>;
export type CommandInput = z.infer<typeof commandInputSchema>;

export const SessionsModel = {
  sessionQuerySchema,
  sessionParamSchema,
  createSessionSchema,
  updateSessionSchema,
  messagesQuerySchema,
  messageInputSchema,
  commandInputSchema,
  forkSessionSchema,
  questionParamSchema,
  questionResponseSchema,
} as const;
