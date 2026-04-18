import { Elysia, t } from 'elysia'

import { ArtifactModel } from './model'
import { artifactService } from '../../container'

export const artifact = new Elysia({ prefix: '/artifact' })
    .get('/', async ({ query }) => {
        return await artifactService.listArtifacts(query);
    }, {
        query: ArtifactModel.querySchema,
        response: {
            200: t.Array(ArtifactModel.artifactDto),
        }
    })
    .get('/:name', async ({ params: { name } }) => {
        const { file, contentType } = await artifactService.getByName(name);

        return new Response(file, {
            headers: {
                'Content-Type': contentType,
            },
        });
    }, {
        response: {
            200: t.File(),
            404: ArtifactModel.fileNotFound,
        }
    })
