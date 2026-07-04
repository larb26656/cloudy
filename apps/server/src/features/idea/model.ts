import { z } from 'zod';

const ideaStatus = z.union([
    z.literal('draft'),
    z.literal('in-progress'),
    z.literal('completed'),
    z.literal('archived'),
]);

const ideaPriority = z.union([
    z.literal('low'),
    z.literal('medium'),
    z.literal('high'),
]);

export const IdeaModel = {
    ideaDto: z.object({
        title: z.string(),
        path: z.string(),
        content: z.string(),
        meta: z.object({
            title: z.string().optional(),
            tags: z.array(z.string()),
            status: ideaStatus,
            priority: ideaPriority,
            createdAt: z.string(),
            updatedAt: z.string(),
        }),
    }),
    ideaDetailDto: z.object({
        title: z.string(),
        path: z.string(),
        content: z.string(),
        files: z.array(z.object({
            name: z.string(),
            path: z.string(),
            size: z.number(),
            updatedAt: z.string().optional(),
        })),
        meta: z.object({
            title: z.string().optional(),
            tags: z.array(z.string()),
            status: ideaStatus,
            priority: ideaPriority,
            createdAt: z.string(),
            updatedAt: z.string(),
        }),
    }),
    querySchema: z.object({
        q: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: ideaStatus.optional(),
        priority: ideaPriority.optional(),
        order: z.string().optional(),
    }),
    createSchema: z.object({
        title: z.string(),
        tags: z.array(z.string()).optional(),
        status: ideaStatus.optional(),
        priority: ideaPriority.optional(),
        content: z.string().optional(),
    }),
    updateSchema: z.object({
        title: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: ideaStatus.optional(),
        priority: ideaPriority.optional(),
    }),
};

export type CreateIdeaInput = z.input<typeof IdeaModel.createSchema>;
export type UpdateIdeaInput = z.input<typeof IdeaModel.updateSchema>;
export type IdeaDto = z.infer<typeof IdeaModel.ideaDto>;
export type IdeaDetailDto = z.infer<typeof IdeaModel.ideaDetailDto>;
export type IdeaQuery = z.input<typeof IdeaModel.querySchema>;
export type IdeaStatus = z.infer<typeof ideaStatus>;
export type IdeaPriority = z.infer<typeof ideaPriority>;