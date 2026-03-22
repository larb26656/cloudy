import { Elysia, t } from 'elysia'

import { Serve, cleanupExpiredSessions } from './service'
import { ServeModel } from './model'
import {
    cron
} from '@elysiajs/cron'

export const serve = new Elysia({ prefix: '/serve' })
    .post(
        '/',
        async ({ body, status }) => {
            const response = await Serve.create(body)

            return status(201, response)
        }, {
        body: ServeModel.createBody,
        response: {
            201: ServeModel.createRes,
        }
    }
    )
    .get(
        '/',
        async () => {
            const response = await Serve.get()

            return response
        }, {
        response: {
            200: t.Array(ServeModel.sessionDto),

        }
    }
    )
    .get(
        '/:key',
        async ({ params
            : { key
            } }) => {
            const response = await Serve.getByKey(key)

            return response
        }, {
        response: {
            200: ServeModel.sessionDto,
            404: ServeModel.sessionNotFound
        }
    }
    )
    .put(
        '/:key',
        async ({ params
            : { key
            }, body }) => {
            const response = await Serve.edit(key, body)

            return response
        }, {
        body: ServeModel.editBody,
        response: {
            200: ServeModel.sessionDto,
            404: ServeModel.sessionNotFound
        }
    }
    )
    .delete(
        '/:key',
        async ({ params
            : { key
            } }) => {
            await Serve.delete(key)
        }, {
        response: {
            404: ServeModel.sessionNotFound
        }
    }
    )
    .get(
        '/:key/files',
        async ({ params: { key }, status }) => {
            const session = await Serve.getByKey(key);
            const indexFile = await Serve.serveIndex(session.dirPath);

            if (!indexFile) {
                throw status(404, 'Index file not found' satisfies ServeModel["indexNotFound"]);
            }

            return new Response(indexFile, {
                headers: {
                    'Content-Type': 'text/html',
                },
            });
        }, {
        response: {
            200: t.File(),
            404: ServeModel.indexNotFound,
        }
    }
    )
    .use(
        cron({
            name: 'cleanup-sessions',
            pattern: '0 * * * *',
            startAt: new Date(),
            run() {
                const cleaned = cleanupExpiredSessions();
                if (cleaned > 0) {
                    console.log(`[Cron] Cleaned up ${cleaned} expired session(s)`);
                }
            }
        })
    )