import { z } from 'zod';

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
};

export type CreateMemoryInput = z.input<typeof MemoryModel.createSchema>;
export type UpdateMemoryInput = z.input<typeof MemoryModel.updateSchema>;
export type MemoryDto = z.infer<typeof MemoryModel.memoryDto>;
export type MemoryQuery = z.input<typeof MemoryModel.querySchema>;