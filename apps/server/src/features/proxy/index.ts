import { Elysia } from 'elysia'
import type { CloudyConfig } from '../../config'

export class ProxyHandler {
    constructor(private config: CloudyConfig) {}

    private get opencodeApiBase(): string {
        return this.config.ocApiBasePath;
    }

    async handler({ request, set, status }: any) {
        const incomingUrl = new URL(request.url)
        const targetPath = incomingUrl.pathname.replace(/^\/oc/, '')
        const url = new URL(targetPath + incomingUrl.search, this.opencodeApiBase)

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

            for (const [key, value] of response.headers.entries()) {
                set.headers[key] = value
            }

            set.headers['Access-Control-Allow-Origin'] = '*'
            set.headers['Access-Control-Allow-Methods'] =
                'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            set.headers['Access-Control-Allow-Headers'] = '*'

            if (isStreaming) {
                return status(200, response.body)
            }

            const data = await response.text()

            set.headers['Content-Type'] = contentType || 'application/json'

            return status(200, data)
        } catch (error) {
            console.error('[Proxy] Error:', error)
            return status(500, { error: 'Proxy error' })
        }
    }

    getPlugin() {
        const handler = this.handler.bind(this);
        return new Elysia({ prefix: '/oc' })
            .get('/*', handler)
            .post('/*', handler)
            .put('/*', handler)
            .patch('/*', handler)
            .delete('/*', handler)
            .options('/*', ({ status, set }) => {
                set.headers['Access-Control-Allow-Origin'] = '*'
                set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
                set.headers['Access-Control-Allow-Headers'] = '*'

                return status(204, null)
            })
    }
}
