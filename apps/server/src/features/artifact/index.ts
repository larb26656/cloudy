import { Elysia, t } from 'elysia'

import { Artifact } from './service'
import { ArtifactModel } from './model'

export const artifact = new Elysia({ prefix: '/artifact' })
    .get('/', async ({ query }) => {
        return await Artifact.listArtifacts(query);
    }, {
        query: ArtifactModel.querySchema,
        response: {
            200: t.Array(ArtifactModel.artifactDto),
        }
    })
    .get('/:name', async ({ params: { name }, status }) => {
        const { file, contentType } = await Artifact.getByName(name);

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

