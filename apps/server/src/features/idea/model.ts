import { t, type UnwrapSchema } from 'elysia'

const ideaStatus = t.Union([
    t.Literal('draft'),
    t.Literal('in-progress'),
    t.Literal('completed'),
    t.Literal('archived'),
])

const ideaPriority = t.Union([
    t.Literal('low'),
    t.Literal('medium'),
    t.Literal('high'),
])

const ideaMetaDto = t.Object({
    title: t.Optional(t.String()),
    tags: t.Array(t.String()),
    status: ideaStatus,
    priority: ideaPriority,
    createdAt: t.Optional(t.Date()),
    updatedAt: t.Optional(t.Date()),
})

export const ideaModelSchema = {
    ideaStatus,
    ideaPriority,
    metaDto: ideaMetaDto,
    ideaDto: t.Object({
        name: t.String(),
        path: t.String(),
        content: t.String(),
        meta: ideaMetaDto,
    }),
    ideaDetailDto: t.Object({
        name: t.String(),
        path: t.String(),
        content: t.String(),
        files: t.Array(t.Object({
            name: t.String(),
            path: t.String(),
            size: t.Number(),
            updatedAt: t.Optional(t.Date()),
        })),
        meta: ideaMetaDto,
    }),
    fileDto: t.Object({
        name: t.String(),
        path: t.String(),
        content: t.String(),
    }),
    fileListDto: t.Object({
        source: t.Literal('idea'),
        files: t.Array(t.Object({
            name: t.String(),
            path: t.String(),
        })),
    }),
    fileMetaDto: t.Object({
        name: t.String(),
        path: t.String(),
        size: t.Number(),
        updatedAt: t.Optional(t.Date()),
    }),
    fileNotFound: t.Literal('File not found'),
    querySchema: t.Object({
        q: t.Optional(t.String()),
        tags: t.Optional(t.Array(t.String())),
        status: t.Optional(ideaStatus),
        priority: t.Optional(ideaPriority),
        order: t.Optional(t.String()),
    }),
    ideaMetaUpdateDto: t.Object({
        title: t.Optional(t.String()),
        tags: t.Optional(t.Array(t.String())),
        status: t.Optional(ideaStatus),
        priority: t.Optional(ideaPriority),
    }),
} as const

export const IdeaModel = ideaModelSchema

export type IdeaModel = {
    [k in keyof typeof ideaModelSchema]: UnwrapSchema<typeof ideaModelSchema[k]>
}
