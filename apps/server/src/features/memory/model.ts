import { z } from 'zod'

export const MemoryModel = {
    memoryDto: z.object({
        id: z.string(),
        title: z.string().nullable(),
        content: z.string(),
        tags: z.array(z.string()),
        createdAt: z.string(),
        updatedAt: z.string(),
    }),
    querySchema: z.object({
        q: z.string().optional(),
        tags: z.array(z.string()).optional(),
        order: z.string().optional(),
    }),
    createSchema: z.object({
        id: z.string(),
        title: z.string().optional(),
        content: z.string(),
        tags: z.array(z.string()).optional(),
    }),
    updateSchema: z.object({
        title: z.string().optional(),
        content: z.string().optional(),
        tags: z.array(z.string()).optional(),
    }),
}

export type MemoryModel = z.infer<typeof MemoryModel> & Record<string, unknown>