import { Elysia } from 'elysia'
import { resourceConfig } from '../../config'

const OPENCODE_API_BASE = resourceConfig.ocApiBasePath;

async function proxyHandler({ request, set, status }: any) {
    const incomingUrl = new URL(request.url)
    const targetPath = incomingUrl.pathname.replace(/^\/oc/, '')
    const url = new URL(targetPath + incomingUrl.search, OPENCODE_API_BASE)

    const headers = new Headers(request.headers)

    try {
        const response = await fetch(url.toString(), {
            method: request.method,
            headers,
            body: request.body,
            signal: request.signal,
        } as RequestInit)

        const contentType = response.headers.get('content-type') || ''
        const isStreaming =
            contentType.includes('text/event-stream') ||
            contentType.includes('stream')

        // copy headers จาก upstream
        for (const [key, value] of response.headers.entries()) {
            set.headers[key] = value
        }

        // CORS
        set.headers['Access-Control-Allow-Origin'] = '*'
        set.headers['Access-Control-Allow-Methods'] =
            'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        set.headers['Access-Control-Allow-Headers'] = '*'

        if (isStreaming) {
            return status(200, response.body)
        }

        const data = await response.text()

        set.headers['Content-Type'] = contentType || 'application/json'
        set.headers['x-example'] = 'Elysia-fox'

        return status(200, data)
    } catch (error) {
        console.error('[Proxy] Error:', error)
        return status(500, { error: 'Proxy error' })
    }
}

export const proxy = new Elysia({ prefix: '/oc' })
    .get('/*', proxyHandler)
    .post('/*', proxyHandler)
    .put('/*', proxyHandler)
    .patch('/*', proxyHandler)
    .delete('/*', proxyHandler)
    .options('/*', ({ status, set }) => {
        set.headers['Access-Control-Allow-Origin'] = '*'
        set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        set.headers['Access-Control-Allow-Headers'] = '*'

        return status(204, null)
    })
