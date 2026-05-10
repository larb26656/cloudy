import { z } from 'zod'

const ideaStatus = z.union([
    z.literal('draft'),
    z.literal('in-progress'),
    z.literal('completed'),
    z.literal('archived'),
])

const ideaPriority = z.union([
    z.literal('low'),
    z.literal('medium'),
    z.literal('high'),
])

const ideaMetaDto = z.object({
    title: z.string().optional(),
    tags: z.array(z.string()),
    status: ideaStatus,
    priority: ideaPriority,
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
})

export const IdeaModel = {
    ideaStatus,
    ideaPriority,
    metaDto: ideaMetaDto,
    ideaDto: z.object({
        title: z.string(),
        path: z.string(),
        content: z.string(),
        meta: ideaMetaDto,
    }),
    ideaDetailDto: z.object({
        title: z.string(),
        path: z.string(),
        content: z.string(),
        files: z.array(z.object({
            name: z.string(),
            path: z.string(),
            size: z.number(),
            updatedAt: z.date().optional(),
        })),
        meta: ideaMetaDto,
    }),
    fileDto: z.object({
        name: z.string(),
        path: z.string(),
        content: z.string(),
    }),
    fileListDto: z.object({
        source: z.literal('idea'),
        files: z.array(z.object({
            name: z.string(),
            path: z.string(),
        })),
    }),
    fileMetaDto: z.object({
        name: z.string(),
        path: z.string(),
        size: z.number(),
        updatedAt: z.date().optional(),
    }),
    fileNotFound: z.literal('File not found'),
    querySchema: z.object({
        q: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: ideaStatus.optional(),
        priority: ideaPriority.optional(),
        order: z.string().optional(),
    }),
    ideaMetaUpdateDto: z.object({
        title: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: ideaStatus.optional(),
        priority: ideaPriority.optional(),
    }),
    ideaCreateDto: z.object({
        title: z.string(),
        tags: z.array(z.string()).optional(),
        status: ideaStatus.optional(),
        priority: ideaPriority.optional(),
        content: z.string().optional(),
    }),
}

export type IdeaModel = z.infer<typeof IdeaModel> & Record<string, unknown>