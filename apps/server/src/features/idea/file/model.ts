import { t, type UnwrapSchema } from 'elysia'

const fileDto = t.Object({
    name: t.String(),
    path: t.String(),
    content: t.String(),
})

const fileMetaDto = t.Object({
    name: t.String(),
    path: t.String(),
    size: t.Number(),
    updatedAt: t.Optional(t.Date()),
})

const fileNotFound = t.Literal('File not found')

export const fileModelSchema = {
    fileDto,
    fileMetaDto,
    fileNotFound,
} as const

export const FileModel = fileModelSchema

export type FileModel = {
    [k in keyof typeof fileModelSchema]: UnwrapSchema<typeof fileModelSchema[k]>
}