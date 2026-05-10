import { z } from 'zod'

const artifactType = z.union([
    z.literal('html'),
    z.literal('pdf'),
    z.literal('image'),
    z.literal('video'),
    z.literal('document'),
])

const artifactMetaDto = z.object({
    title: z.string().optional(),
    tags: z.array(z.string()),
    type: artifactType,
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
})

export const ArtifactModel = {
    artifactType,
    metaDto: artifactMetaDto,
    artifactDto: z.object({
        name: z.string(),
        path: z.string(),
        content: z.string(),
        meta: artifactMetaDto,
    }),
    getFileRes: z.object({
        name: z.string(),
        contentType: z.string(),
        file: z.any(),
    }),
    fileDto: z.object({
        name: z.string(),
        path: z.string(),
        content: z.string(),
    }),
    fileListDto: z.object({
        source: z.literal('artifact'),
        files: z.array(z.object({
            name: z.string(),
            path: z.string(),
        })),
    }),
    fileNotFound: z.literal('File not found'),
    querySchema: z.object({
        q: z.string().optional(),
        tags: z.array(z.string()).optional(),
        type: artifactType.optional(),
        order: z.string().optional(),
    }),
}

export type ArtifactModel = z.infer<typeof ArtifactModel> & Record<string, unknown>