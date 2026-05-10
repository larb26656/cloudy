import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { FileModel } from './model'
import { ideaFileService } from '../../../container'

const createFileBodySchema = FileModel.fileDto.pick({ name: true }).extend({
    content: FileModel.fileDto.shape.content.optional()
})

const updateFileBodySchema = FileModel.fileDto.pick({ content: true })

export const ideaFile = new Hono()
    .get('/:ideaPath/files/:filename', async (c) => {
        const { ideaPath, filename } = c.req.param()
        return c.json(await ideaFileService.getFile(ideaPath, filename))
    })
    .post('/:ideaPath/files/', zValidator('json', createFileBodySchema), async (c) => {
        const { ideaPath } = c.req.param()
        const body = c.req.valid('json') as { name: string; content?: string }
        return c.json(await ideaFileService.createFile(ideaPath, body.name, body.content), 201)
    })
    .put('/:ideaPath/files/:filename', zValidator('json', updateFileBodySchema), async (c) => {
        const { ideaPath, filename } = c.req.param()
        const body = c.req.valid('json') as { content: string }
        return c.json(await ideaFileService.updateFile(`${ideaPath}/${filename}`, body.content))
    })
    .delete('/:ideaPath/files/:filename', async (c) => {
        const { ideaPath, filename } = c.req.param()
        return c.json(await ideaFileService.deleteFile(`${ideaPath}/${filename}`))
    })