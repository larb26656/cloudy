import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { MemoryModel } from './model'
import { memoryService } from '../../container'

export const memory = new Hono()
    .get('/', zValidator('query', MemoryModel.querySchema), async (c) => {
        const query = c.req.valid('query')
        return c.json(await memoryService.listMemories(query))
    })
    .get('/:path', async (c) => {
        const { path } = c.req.param()
        return c.json(await memoryService.getMemory(path))
    })