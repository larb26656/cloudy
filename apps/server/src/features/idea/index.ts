import { Elysia, t } from 'elysia'

import { ideaModelSchema } from './model'
import { ideaService } from '../../container'
import { ideaFile } from './file/index'

export const idea = new Elysia({ prefix: '/idea' })
    .get('/', async ({ query }) => {
        return await ideaService.listIdeas(query);
    }, {
        query: ideaModelSchema.querySchema,
        response: {
            200: t.Array(ideaModelSchema.ideaDto),
        }
    })
    .get('/:path', async ({ params: { path } }) => {
        return await ideaService.getIdea(path);
    }, {
        response: {
            200: ideaModelSchema.ideaDetailDto,
            404: ideaModelSchema.fileNotFound,
        }
    })
    .post('/', async ({ body }) => {
        return await ideaService.createIdea(body);
    }, {
        body: ideaModelSchema.ideaCreateDto,
        response: {
            200: ideaModelSchema.ideaDetailDto,
            400: t.String(),
        }
    })
    .delete('/:path', async ({ params: { path } }) => {
        return await ideaService.deleteIdea(path);
    }, {
        response: {
            200: t.Object({ success: t.Boolean() }),
            400: t.String(),
            404: ideaModelSchema.fileNotFound,
        }
    })
    .patch('/:path', async ({ params: { path }, body }) => {
        return await ideaService.patchMeta(path, body);
    }, {
        body: ideaModelSchema.ideaMetaUpdateDto,
        response: {
            200: ideaModelSchema.ideaDto,
            404: ideaModelSchema.fileNotFound,
        }
    })
    .patch('/:path/touch', async ({ params: { path } }) => {
        await ideaService.touchUpdatedAt(path);
        return { success: true };
    }, {
        response: {
            200: t.Object({ success: t.Boolean() }),
            404: t.String(),
        }
    })
    .use(ideaFile)
