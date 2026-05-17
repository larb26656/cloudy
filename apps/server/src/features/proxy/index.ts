import { Hono } from 'hono'
import type { Context } from 'hono'
import { proxy as proxyFetch } from 'hono/proxy'
import { describeRoute } from 'hono-openapi'

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
} as const

const proxyHandler = async (c: Context) => {
    const opencodeApiBase = c.req.header('X-OpenCode-API-Base')
        || c.req.query('X-OpenCode-API-Base')

    if (!opencodeApiBase) {
        return c.json({ error: 'Missing X-OpenCode-API-Base header or query parameter' }, 400)
    }

    const incomingUrl = new URL(c.req.url)
    const targetPath = incomingUrl.pathname.replace(/^\/oc/, '')
    const targetUrl = new URL(targetPath + incomingUrl.search, opencodeApiBase)

    const req = c.req.raw
    const res = await proxyFetch(targetUrl.toString(), {
        method: req.method,
        headers: {
            ...c.req.header(),
            'X-Forwarded-For': c.req.header('host') || '127.0.0.1',
            'X-Forwarded-Host': c.req.header('host'),
            Authorization: undefined,
        },
        body: req.body,
        signal: req.signal,
    })

    res.headers.delete('Set-Cookie')

    const contentType = res.headers.get('content-type') || ''

    return new Response(res.body, {
        status: res.status,
        headers: {
            'Content-Type': contentType || 'application/octet-stream',
            ...Object.fromEntries(Object.entries(CORS_HEADERS)),
        },
    })
}

export const proxy = new Hono()
    .get('/*',
        describeRoute({
            description: 'Proxy GET requests to OpenCode API',
            tags: ['Proxy'],
            responses: { 200: { description: 'Proxied response' } },
        }),
        proxyHandler)
    .post('/*',
        describeRoute({
            description: 'Proxy POST requests to OpenCode API',
            tags: ['Proxy'],
            responses: { 200: { description: 'Proxied response' } },
        }),
        proxyHandler)
    .put('/*',
        describeRoute({
            description: 'Proxy PUT requests to OpenCode API',
            tags: ['Proxy'],
            responses: { 200: { description: 'Proxied response' } },
        }),
        proxyHandler)
    .patch('/*',
        describeRoute({
            description: 'Proxy PATCH requests to OpenCode API',
            tags: ['Proxy'],
            responses: { 200: { description: 'Proxied response' } },
        }),
        proxyHandler)
    .delete('/*',
        describeRoute({
            description: 'Proxy DELETE requests to OpenCode API',
            tags: ['Proxy'],
            responses: { 200: { description: 'Proxied response' } },
        }),
        proxyHandler)
    .options('/*', (c) => {
        const headers = Object.fromEntries(Object.entries(CORS_HEADERS))
        return c.body(null, 204, headers)
    })