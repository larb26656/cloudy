import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ArtifactModel } from './model'
import { artifactService } from '../../container'

export const artifact = new Hono()
    .get('/', zValidator('query', ArtifactModel.querySchema), async (c) => {
        const query = c.req.valid('query')
        return c.json(await artifactService.listArtifacts(query))
    })
    .get('/:name', async (c) => {
        const { name } = c.req.param()
        return await artifactService.getByName(name)
    })