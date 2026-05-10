import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { IdeaModel } from './model'
import { ideaService } from '../../container'
import { ideaFile } from './file/index'

export const idea = new Hono()
    .get('/', zValidator('query', IdeaModel.querySchema), async (c) => {
        const query = c.req.valid('query')
        return c.json(await ideaService.listIdeas(query))
    })
    .get('/:path', async (c) => {
        const { path } = c.req.param()
        return c.json(await ideaService.getIdea(path))
    })
    .post('/', zValidator('json', IdeaModel.ideaCreateDto), async (c) => {
        const body = c.req.valid('json')
        return c.json(await ideaService.createIdea(body), 201)
    })
    .delete('/:path', async (c) => {
        const { path } = c.req.param()
        return c.json(await ideaService.deleteIdea(path))
    })
    .patch('/:path', zValidator('json', IdeaModel.ideaMetaUpdateDto), async (c) => {
        const { path } = c.req.param()
        const body = c.req.valid('json')
        return c.json(await ideaService.patchMeta(path, body))
    })
    .patch('/:path/touch', async (c) => {
        const { path } = c.req.param()
        await ideaService.touchUpdatedAt(path)
        return c.json({ success: true })
    })
    .route('/', ideaFile)