import { z } from 'zod';

const artifactType = z.union([
    z.literal('html'),
    z.literal('pdf'),
    z.literal('image'),
    z.literal('video'),
    z.literal('document'),
]);

export const ArtifactModel = {
    artifactDto: z.object({
        name: z.string(),
        path: z.string(),
        content: z.string(),
        meta: z.object({
            title: z.string().optional(),
            tags: z.array(z.string()),
            type: artifactType,
            createdAt: z.string().optional(),
            updatedAt: z.string().optional(),
        }),
    }),
    querySchema: z.object({
        q: z.string().optional(),
        tags: z.array(z.string()).optional(),
        type: artifactType.optional(),
        order: z.string().optional(),
    }),
    createSchema: z.object({
        name: z.string(),
        content: z.string().optional(),
        tags: z.array(z.string()).optional(),
        type: artifactType.optional(),
    }),
    updateSchema: z.object({
        content: z.string().optional(),
        tags: z.array(z.string()).optional(),
        type: artifactType.optional(),
    }),
};

export type CreateArtifactInput = z.input<typeof ArtifactModel.createSchema>;
export type UpdateArtifactInput = z.input<typeof ArtifactModel.updateSchema>;
export type ArtifactDto = z.infer<typeof ArtifactModel.artifactDto>;
export type ArtifactQuery = z.input<typeof ArtifactModel.querySchema>;
export type ArtifactType = z.infer<typeof artifactType>;