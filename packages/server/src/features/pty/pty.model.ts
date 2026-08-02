import { z } from "zod";

export const createSessionSchema = z.object({
  directory: z.string().min(1),
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

export const sessionDtoSchema = z.object({
  id: z.string(),
  alive: z.boolean(),
  exitCode: z.number().int().nullable(),
});
export type SessionDto = z.infer<typeof sessionDtoSchema>;

export const createSessionResponseSchema = z.object({
  id: z.string(),
});
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;

export const shellDtoSchema = z.object({
  path: z.string(),
  acceptable: z.boolean(),
});
export type ShellDto = z.infer<typeof shellDtoSchema>;

export const PtyModel = {
  createSessionSchema,
  resizeSchema,
  sessionDtoSchema,
  createSessionResponseSchema,
  shellDtoSchema,
} as const;
