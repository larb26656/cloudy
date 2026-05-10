import { Hono } from 'hono'
import type { Context } from 'hono'
import { proxyService } from '../../container'

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
} as const

const proxyHandler = async (c: Context) => {
    const request = c.req.raw
    const opencodeApiBase = request.headers.get('X-OpenCode-API-Base') || c.req.query('X-OpenCode-API-Base')

    if (!opencodeApiBase) {
        return c.json({ error: 'Missing X-OpenCode-API-Base header or query parameter' }, 400)
    }

    const result = await proxyService.proxy(request, opencodeApiBase)

    if (result.isStreaming) {
        return new Response(result.body as ReadableStream, {
            headers: {
                'Content-Type': result.contentType || 'application/octet-stream',
                ...Object.fromEntries(Object.entries(CORS_HEADERS)),
            },
        })
    }

    return new Response(result.body as string, {
        headers: {
            'Content-Type': result.contentType || 'application/json',
            ...Object.fromEntries(Object.entries(CORS_HEADERS)),
        },
    })
}

export const proxy = new Hono()
    .get('/*', proxyHandler)
    .post('/*', proxyHandler)
    .put('/*', proxyHandler)
    .patch('/*', proxyHandler)
    .delete('/*', proxyHandler)
    .options('/*', (c) => {
        const headers = Object.fromEntries(Object.entries(CORS_HEADERS))
        return c.body(null, 204, headers)
    })