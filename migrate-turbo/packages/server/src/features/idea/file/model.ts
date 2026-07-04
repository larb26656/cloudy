import { z } from 'zod'

const fileDto = z.object({
    name: z.string(),
    path: z.string(),
    content: z.string(),
})

const fileMetaDto = z.object({
    name: z.string(),
    path: z.string(),
    size: z.number(),
    updatedAt: z.date().optional(),
})

const fileNotFound = z.literal('File not found')

export const FileModel = {
    fileDto,
    fileMetaDto,
    fileNotFound,
}

export type FileModel = z.infer<typeof FileModel> & Record<string, unknown>