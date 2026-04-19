import { Elysia } from 'elysia'
import { proxyService } from '../../container'

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
} as const

const proxyHandler = async ({ request, set, status, query }: { request: Request; set: any; status: any; query: any }) => {
    const opencodeApiBase = request.headers.get('X-OpenCode-API-Base') || query["X-OpenCode-API-Base"];

    if (!opencodeApiBase) {
        return status(400, { error: 'Missing X-OpenCode-API-Base header or query parameter' })
    }

    const result = await proxyService.proxy(request, opencodeApiBase)

    if (result.isStreaming) {
        set.headers['Content-Type'] = result.contentType || 'application/octet-stream'
        for (const [key, value] of Object.entries(CORS_HEADERS)) {
            set.headers[key] = value
        }
        return new Response(result.body, {
            headers: {
                'Content-Type': result.contentType || 'application/octet-stream',
                ...CORS_HEADERS,
            },
        })
    }

    set.headers['Content-Type'] = result.contentType || 'application/json'
    return result.body
}

export const proxy = new Elysia({ prefix: '/oc' })
    .get('/*', proxyHandler)
    .post('/*', proxyHandler)
    .put('/*', proxyHandler)
    .patch('/*', proxyHandler)
    .delete('/*', proxyHandler)
    .options('/*', ({ set }) => {
        for (const [key, value] of Object.entries(CORS_HEADERS)) {
            set.headers[key] = value
        }
        return null
    })
