import { Elysia, t } from 'elysia'

import { fileModelSchema } from './model'
import { ideaFileService } from '../../../container'

export const ideaFile = new Elysia({ prefix: '/idea/:ideaPath/files' })
    .get('/:filename', async ({ params: { ideaPath, filename } }) => {
        return await ideaFileService.getFile(ideaPath, filename);
    }, {
        response: {
            200: fileModelSchema.fileDto,
            404: fileModelSchema.fileNotFound,
        }
    })
    .post('/', async ({ params: { ideaPath }, body }) => {
        const { filename, content } = body as { filename: string; content?: string };
        return await ideaFileService.createFile(ideaPath, filename, content);
    }, {
        body: t.Object({
            filename: t.String(),
            content: t.Optional(t.String()),
        }),
        response: {
            200: fileModelSchema.fileDto,
            400: t.String(),
            404: fileModelSchema.fileNotFound,
        }
    })
    .put('/:filename', async ({ params: { ideaPath, filename }, body }) => {
        const { content } = body as { content: string };
        return await ideaFileService.updateFile(`${ideaPath}/${filename}`, content);
    }, {
        body: t.Object({
            content: t.String(),
        }),
        response: {
            200: fileModelSchema.fileDto,
            404: fileModelSchema.fileNotFound,
        }
    })
    .delete('/:filename', async ({ params: { ideaPath, filename } }) => {
        return await ideaFileService.deleteFile(`${ideaPath}/${filename}`);
    }, {
        response: {
            200: t.Object({ success: t.Boolean() }),
            400: t.String(),
            404: fileModelSchema.fileNotFound,
        }
    })
