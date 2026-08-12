import { z } from "zod";

export const createSessionSchema = z.object({
  directory: z.string().min(1),
  name: z.string().trim().min(1).max(80).optional(),
  command: z.string().optional(),
  cols: z.number().int().positive().optional(),
  rows: z.number().int().positive().optional(),
  env: z.record(z.string(), z.string()).optional(),
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const resizeSchema = z.object({
  cols: z.number().int().positive(),
  rows: z.number().int().positive(),
});
export type ResizeInput = z.infer<typeof resizeSchema>;

export const updateSessionSchema = z.object({
  name: z.string().trim().min(1).max(80),
});
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

export const sessionDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  directory: z.string(),
  command: z.string(),
  alive: z.boolean(),
  exitCode: z.number().int().nullable(),
  createdAt: z.number().int(),
  lastActivityAt: z.number().int(),
});
export type SessionDto = z.infer<typeof sessionDtoSchema>;

export const sessionListDtoSchema = z.array(sessionDtoSchema);

export const createSessionResponseSchema = sessionDtoSchema;
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;

export const shellDtoSchema = z.object({
  path: z.string(),
  acceptable: z.boolean(),
});
export type ShellDto = z.infer<typeof shellDtoSchema>;

export const PtyModel = {
  createSessionSchema,
  resizeSchema,
  updateSessionSchema,
  sessionDtoSchema,
  sessionListDtoSchema,
  createSessionResponseSchema,
  shellDtoSchema,
} as const;
