import { z } from "zod";

export const quickCloudyQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(5),
  search: z.string().optional(),
});

export type QuickCloudyQuery = z.infer<typeof quickCloudyQuerySchema>;

export const QuickCloudyModel = { quickCloudyQuerySchema } as const;
