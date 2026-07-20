import type { Context } from 'hono';
import { proxy as proxyFetch } from 'hono/proxy';
import { HTTPException } from 'hono/http-exception';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
} as const;

export class ProxyService {
    constructor(private defaultApiBase: string = '') {}

    async proxyRequest(c: Context): Promise<Response> {
        if (!this.defaultApiBase) {
            throw new HTTPException(400, { message: 'Missing opencodeApiBase config. Set opencodeApiBase in config.json, CLOUDY_OPENCODE_API_BASE env, or --opencode-api-base CLI flag' });
        }

        const opencodeApiBase = this.defaultApiBase;

        const incomingUrl = new URL(c.req.url);
        const targetPath = incomingUrl.pathname.replace(/^\/oc/, '');
        const targetUrl = new URL(targetPath + incomingUrl.search, opencodeApiBase);

        const req = c.req.raw;
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
        });

        res.headers.delete('Set-Cookie');

        const contentType = res.headers.get('content-type') || '';

        return new Response(res.body, {
            status: res.status,
            headers: {
                'Content-Type': contentType || 'application/octet-stream',
                ...Object.fromEntries(Object.entries(CORS_HEADERS)),
            },
        });
    }
}