import { z } from 'zod'

const memoryMetaDto = z.object({
    title: z.string().optional(),
    tags: z.array(z.string()),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
})

export const MemoryModel = {
    metaDto: memoryMetaDto,
    memoryDto: z.object({
        name: z.string(),
        path: z.string(),
        content: z.string(),
        meta: memoryMetaDto,
    }),
    fileDto: z.object({
        name: z.string(),
        path: z.string(),
        content: z.string(),
    }),
    fileListDto: z.object({
        source: z.literal('memory'),
        files: z.array(z.object({
            name: z.string(),
            path: z.string(),
        })),
    }),
    fileNotFound: z.literal('File not found'),
    querySchema: z.object({
        q: z.string().optional(),
        tags: z.array(z.string()).optional(),
        order: z.string().optional(),
    }),
}

export type MemoryModel = z.infer<typeof MemoryModel> & Record<string, unknown>