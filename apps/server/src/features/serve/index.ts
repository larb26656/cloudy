import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { Serve, cleanupExpiredSessions } from './service'
import { ServeModel } from './model'
import cron from 'node-cron'

export const serve = new Hono()
    .post('/', zValidator('json', ServeModel.createBody), async (c) => {
        const body = c.req.valid('json')
        const response = await Serve.create(body)
        return c.json(response, 201)
    })
    .get('/', async (c) => {
        return c.json(await Serve.get())
    })
    .get('/:key', async (c) => {
        const { key } = c.req.param()
        return c.json(await Serve.getByKey(key))
    })
    .put('/:key', zValidator('json', ServeModel.editBody), async (c) => {
        const { key } = c.req.param()
        const body = c.req.valid('json')
        return c.json(await Serve.edit(key, body))
    })
    .delete('/:key', async (c) => {
        const { key } = c.req.param()
        await Serve.delete(key)
        return c.body(null, 204)
    })
    .get('/:key/files', async (c) => {
        const { key } = c.req.param()
        const session = await Serve.getByKey(key)
        return await Serve.serveIndex(session.dirPath)
    })

export function startCleanupCron() {
    cron.schedule('0 * * * *', () => {
        const cleaned = cleanupExpiredSessions()
        if (cleaned > 0) {
            console.log(`[Cron] Cleaned up ${cleaned} expired session(s)`)
        }
    })
}