import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { IdeaModel } from './model';
import type { IdeaService } from './service';
import type { IdeaFile } from './file/service';
import { createIdeaFileApp } from './file';

export function createIdeaApp({ ideaService, ideaFileService }: { ideaService: IdeaService; ideaFileService: IdeaFile }) {
    return new Hono()
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
                const query = c.req.valid('query');
                return c.json(await ideaService.listIdeas(query));
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
                const { path } = c.req.param();
                return c.json(await ideaService.getIdea(path));
            })
        .post('/',
            describeRoute({
                description: 'Create new idea',
                tags: ['Ideas'],
                responses: {
                    201: {
                        description: 'Idea created',
                        content: {
                            'application/json': {
                                schema: resolver(IdeaModel.ideaDetailDto),
                            },
                        },
                    },
                },
            }),
            validator('json', IdeaModel.createSchema),
            async (c) => {
                const body = c.req.valid('json');
                return c.json(await ideaService.createIdea(body), 201);
            })
        .patch('/:path',
            describeRoute({
                description: 'Update idea metadata',
                tags: ['Ideas'],
                responses: {
                    200: {
                        description: 'Idea updated',
                        content: {
                            'application/json': {
                                schema: resolver(IdeaModel.ideaDetailDto),
                            },
                        },
                    },
                },
            }),
            validator('json', IdeaModel.updateSchema),
            async (c) => {
                const { path } = c.req.param();
                const body = c.req.valid('json');
                return c.json(await ideaService.updateIdeaMeta(path, body));
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
                const { path } = c.req.param();
                await ideaService.touchUpdatedAt(path);
                return c.json({ success: true });
            })
        .delete('/:path',
            describeRoute({
                description: 'Delete idea',
                tags: ['Ideas'],
                responses: {
                    204: { description: 'Idea deleted' },
                },
            }),
            async (c) => {
                const { path } = c.req.param();
                await ideaService.deleteIdea(path);
                return c.body(null, 204);
            })
        .route('/files', createIdeaFileApp({ ideaFileService }));
}

export { createIdeaFileApp } from './file';