import { t, type UnwrapSchema } from 'elysia'

const memoryMetaDto = t.Object({
    title: t.Optional(t.String()),
    tags: t.Array(t.String()),
    createdAt: t.Optional(t.String()),
    updatedAt: t.Optional(t.String()),
})

export const MemoryModel = {
    metaDto: memoryMetaDto,
    memoryDto: t.Object({
        name: t.String(),
        path: t.String(),
        content: t.String(),
        meta: memoryMetaDto,
    }),
    fileDto: t.Object({
        name: t.String(),
        path: t.String(),
        content: t.String(),
    }),
    fileListDto: t.Object({
        source: t.Literal('memory'),
        files: t.Array(t.Object({
            name: t.String(),
            path: t.String(),
        })),
    }),
    fileNotFound: t.Literal('File not found'),
    querySchema: t.Object({
        q: t.Optional(t.String()),
        tags: t.Optional(t.Array(t.String())),
        order: t.Optional(t.String()),
    }),
} as const

export type MemoryModel = {
    [k in keyof typeof MemoryModel]: UnwrapSchema<typeof MemoryModel[k]>
}
