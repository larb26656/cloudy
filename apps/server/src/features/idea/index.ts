import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { IdeaModel } from './model'
import { ideaService } from '../../container'
import { ideaFile } from './file/index'

export const idea = new Hono()
    .get('/',
        describeRoute({
            description: 'List all ideas',
            tags: ['Ideas'],
            responses: {
                200: {
                    description: 'List of ideas',
                    content: {
                        'application/json': {
                            schema: resolver(IdeaModel.ideaDto.array()),
                        },
                    },
                },
            },
        }),
        validator('query', IdeaModel.querySchema),
        async (c) => {
            const query = c.req.valid('query')
            return c.json(await ideaService.listIdeas(query))
        })
    .get('/:path',
        describeRoute({
            description: 'Get idea by path',
            tags: ['Ideas'],
            responses: {
                200: {
                    description: 'Idea details',
                    content: {
                        'application/json': {
                            schema: resolver(IdeaModel.ideaDetailDto),
                        },
                    },
                },
            },
        }),
        async (c) => {
            const { path } = c.req.param()
            return c.json(await ideaService.getIdea(path))
        })
    .post('/',
        describeRoute({
            description: 'Create new idea',
            tags: ['Ideas'],
            responses: {
                201: { description: 'Idea created' },
            },
        }),
        validator('json', IdeaModel.ideaCreateDto),
        async (c) => {
            const body = c.req.valid('json')
            return c.json(await ideaService.createIdea(body), 201)
        })
    .delete('/:path',
        describeRoute({
            description: 'Delete idea',
            tags: ['Ideas'],
            responses: {
                200: { description: 'Idea deleted' },
            },
        }),
        async (c) => {
            const { path } = c.req.param()
            return c.json(await ideaService.deleteIdea(path))
        })
    .patch('/:path',
        describeRoute({
            description: 'Update idea metadata',
            tags: ['Ideas'],
            responses: {
                200: { description: 'Idea updated' },
            },
        }),
        validator('json', IdeaModel.ideaMetaUpdateDto),
        async (c) => {
            const { path } = c.req.param()
            const body = c.req.valid('json')
            return c.json(await ideaService.patchMeta(path, body))
        })
    .patch('/:path/touch',
        describeRoute({
            description: 'Touch idea updatedAt',
            tags: ['Ideas'],
            responses: {
                200: { description: 'Touched' },
            },
        }),
        async (c) => {
            const { path } = c.req.param()
            await ideaService.touchUpdatedAt(path)
            return c.json({ success: true })
        })
    .route('/', ideaFile)