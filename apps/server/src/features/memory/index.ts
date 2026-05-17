import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { MemoryModel } from './model'
import { memoryService } from '../../container'

export const memory = new Hono()
    .get('/',
        describeRoute({
            description: 'List all memories',
            tags: ['Memories'],
            responses: {
                200: {
                    description: 'List of memories',
                    content: {
                        'application/json': {
                            schema: resolver(MemoryModel.memoryDto.array()),
                        },
                    },
                },
            },
        }),
        validator('query', MemoryModel.querySchema),
        async (c) => {
            const query = c.req.valid('query')
            return c.json(await memoryService.listMemories(query))
        })
    .get('/:path',
        describeRoute({
            description: 'Get memory by path',
            tags: ['Memories'],
            responses: {
                200: {
                    description: 'Memory details',
                    content: {
                        'application/json': {
                            schema: resolver(MemoryModel.memoryDto),
                        },
                    },
                },
            },
        }),
        async (c) => {
            const { path } = c.req.param()
            return c.json(await memoryService.getMemory(path))
        })