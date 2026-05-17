import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { Serve, cleanupExpiredSessions } from './service'
import { ServeModel } from './model'
import cron from 'node-cron'

export const serve = new Hono()
    .post('/',
        describeRoute({
            description: 'Create session',
            tags: ['Serve'],
            responses: {
                201: {
                    description: 'Session created',
                    content: {
                        'application/json': {
                            schema: resolver(ServeModel.createRes),
                        },
                    },
                },
            },
        }),
        validator('json', ServeModel.createBody),
        async (c) => {
            const body = c.req.valid('json')
            const response = await Serve.create(body)
            return c.json(response, 201)
        })
    .get('/',
        describeRoute({
            description: 'List sessions',
            tags: ['Serve'],
            responses: {
                200: {
                    description: 'List of sessions',
                    content: {
                        'application/json': {
                            schema: resolver(ServeModel.sessionDto.array()),
                        },
                    },
                },
            },
        }),
        async (c) => {
            return c.json(await Serve.get())
        })
    .get('/:key',
        describeRoute({
            description: 'Get session by key',
            tags: ['Serve'],
            responses: {
                200: {
                    description: 'Session details',
                    content: {
                        'application/json': {
                            schema: resolver(ServeModel.sessionDto),
                        },
                    },
                },
            },
        }),
        async (c) => {
            const { key } = c.req.param()
            return c.json(await Serve.getByKey(key))
        })
    .put('/:key',
        describeRoute({
            description: 'Update session',
            tags: ['Serve'],
            responses: {
                200: { description: 'Session updated' },
            },
        }),
        validator('json', ServeModel.editBody),
        async (c) => {
            const { key } = c.req.param()
            const body = c.req.valid('json')
            return c.json(await Serve.edit(key, body))
        })
    .delete('/:key',
        describeRoute({
            description: 'Delete session',
            tags: ['Serve'],
            responses: {
                204: { description: 'Session deleted' },
            },
        }),
        async (c) => {
            const { key } = c.req.param()
            await Serve.delete(key)
            return c.body(null, 204)
        })
    .get('/:key/files',
        describeRoute({
            description: 'Serve session files',
            tags: ['Serve'],
            responses: {
                200: { description: 'Files served' },
            },
        }),
        async (c) => {
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