import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { MemoryModel } from './model'
import { MemoryService } from './service'

export function createMemoryApp({ memoryService }: { memoryService: MemoryService }) {
    return new Hono()
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
        .get('/:id',
            describeRoute({
                description: 'Get memory by id',
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
                const { id } = c.req.param()
                return c.json(await memoryService.getMemory(id))
            })
        .post('/',
            describeRoute({
                description: 'Create a new memory',
                tags: ['Memories'],
                responses: {
                    201: {
                        description: 'Memory created',
                        content: {
                            'application/json': {
                                schema: resolver(MemoryModel.memoryDto),
                            },
                        },
                    },
                },
            }),
            validator('json', MemoryModel.createSchema),
            async (c) => {
                const input = c.req.valid('json')
                const created = await memoryService.createMemory(input)
                return c.json(created, 201)
            })
        .put('/:id',
            describeRoute({
                description: 'Update a memory',
                tags: ['Memories'],
                responses: {
                    200: {
                        description: 'Memory updated',
                        content: {
                            'application/json': {
                                schema: resolver(MemoryModel.memoryDto),
                            },
                        },
                    },
                },
            }),
            validator('json', MemoryModel.updateSchema),
            async (c) => {
                const { id } = c.req.param()
                const input = c.req.valid('json')
                return c.json(await memoryService.updateMemory(id, input))
            })
        .delete('/:id',
            describeRoute({
                description: 'Delete a memory',
                tags: ['Memories'],
                responses: {
                    204: {
                        description: 'Memory deleted',
                    },
                },
            }),
            async (c) => {
                const { id } = c.req.param()
                await memoryService.deleteMemory(id)
                return c.body(null, 204)
            })
}