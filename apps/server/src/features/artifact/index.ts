import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { ArtifactModel } from './model'
import { artifactService } from '../../container'

export const artifact = new Hono()
    .get('/',
        describeRoute({
            description: 'List all artifacts',
            tags: ['Artifacts'],
            responses: {
                200: {
                    description: 'List of artifacts',
                    content: {
                        'application/json': {
                            schema: resolver(ArtifactModel.artifactDto.array()),
                        },
                    },
                },
            },
        }),
        validator('query', ArtifactModel.querySchema),
        async (c) => {
            const query = c.req.valid('query')
            return c.json(await artifactService.listArtifacts(query))
        })
    .get('/:name',
        describeRoute({
            description: 'Get artifact by name',
            tags: ['Artifacts'],
            responses: {
                200: {
                    description: 'Artifact details',
                    content: {
                        'application/json': {
                            schema: resolver(ArtifactModel.artifactDto),
                        },
                    },
                },
            },
        }),
        async (c) => {
            const { name } = c.req.param()
            return await artifactService.getByName(name)
        })