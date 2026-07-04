import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { FileModel } from './model';
import type { IdeaFile } from './service';

const createFileBodySchema = FileModel.fileDto.pick({ name: true }).extend({
    content: FileModel.fileDto.shape.content.optional(),
});

const updateFileBodySchema = FileModel.fileDto.pick({ content: true });

export function createIdeaFileApp({ ideaFileService }: { ideaFileService: IdeaFile }) {
    return new Hono()
        .get('/:ideaPath/files/:filename',
            describeRoute({
                description: 'Get file from idea',
                tags: ['Idea Files'],
                responses: {
                    200: {
                        description: 'File content',
                        content: {
                            'application/json': {
                                schema: resolver(FileModel.fileDto),
                            },
                        },
                    },
                },
            }),
            async (c) => {
                const { ideaPath, filename } = c.req.param();
                return c.json(await ideaFileService.getFile(ideaPath, filename));
            })
        .post('/:ideaPath/files/',
            describeRoute({
                description: 'Create file in idea',
                tags: ['Idea Files'],
                responses: {
                    201: { description: 'File created' },
                },
            }),
            validator('json', createFileBodySchema),
            async (c) => {
                const { ideaPath } = c.req.param();
                const body = c.req.valid('json') as { name: string; content?: string };
                return c.json(await ideaFileService.createFile(ideaPath, body.name, body.content), 201);
            })
        .put('/:ideaPath/files/:filename',
            describeRoute({
                description: 'Update file in idea',
                tags: ['Idea Files'],
                responses: {
                    200: { description: 'File updated' },
                },
            }),
            validator('json', updateFileBodySchema),
            async (c) => {
                const { ideaPath, filename } = c.req.param();
                const body = c.req.valid('json') as { content: string };
                return c.json(await ideaFileService.updateFile(`${ideaPath}/${filename}`, body.content));
            })
        .delete('/:ideaPath/files/:filename',
            describeRoute({
                description: 'Delete file from idea',
                tags: ['Idea Files'],
                responses: {
                    200: { description: 'File deleted' },
                },
            }),
            async (c) => {
                const { ideaPath, filename } = c.req.param();
                return c.json(await ideaFileService.deleteFile(`${ideaPath}/${filename}`));
            });
}