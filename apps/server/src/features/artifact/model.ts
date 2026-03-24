import { t, type UnwrapSchema } from 'elysia'

const artifactType = t.Union([
    t.Literal('html'),
    t.Literal('pdf'),
    t.Literal('image'),
    t.Literal('video'),
    t.Literal('document'),
])

const artifactMetaDto = t.Object({
    title: t.Optional(t.String()),
    tags: t.Array(t.String()),
    type: artifactType,
    createdAt: t.Optional(t.Date()),
    updatedAt: t.Optional(t.Date()),
})

export const ArtifactModel = {
    artifactType,
    metaDto: artifactMetaDto,
    artifactDto: t.Object({
        name: t.String(),
        path: t.String(),
        content: t.String(),
        meta: artifactMetaDto,
    }),
    getFileRes: t.Object({
        name: t.String(),
        contentType: t.String(),
        // TODO find better solution
        file: t.Any(),
    }),
    fileDto: t.Object({
        name: t.String(),
        path: t.String(),
        content: t.String(),
    }),
    fileListDto: t.Object({
        source: t.Literal('artifact'),
        files: t.Array(t.Object({
            name: t.String(),
            path: t.String(),
        })),
    }),
    fileNotFound: t.Literal('File not found'),
    querySchema: t.Object({
        q: t.Optional(t.String()),
        tags: t.Optional(t.Array(t.String())),
        type: t.Optional(artifactType),
        order: t.Optional(t.String()),
    }),
} as const

export type ArtifactModel = {
    [k in keyof typeof ArtifactModel]: UnwrapSchema<typeof ArtifactModel[k]>
}
