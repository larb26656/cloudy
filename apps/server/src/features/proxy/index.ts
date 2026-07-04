import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import type { ProxyService } from './service';

export function createProxyApp({ proxyService }: { proxyService: ProxyService }) {
    return new Hono()
        .get('/*',
            describeRoute({
                description: 'Proxy GET requests to OpenCode API',
                tags: ['Proxy'],
                responses: { 200: { description: 'Proxied response' } },
            }),
            async (c) => {
                return proxyService.proxyRequest(c);
            })
        .post('/*',
            describeRoute({
                description: 'Proxy POST requests to OpenCode API',
                tags: ['Proxy'],
                responses: { 200: { description: 'Proxied response' } },
            }),
            async (c) => {
                return proxyService.proxyRequest(c);
            })
        .put('/*',
            describeRoute({
                description: 'Proxy PUT requests to OpenCode API',
                tags: ['Proxy'],
                responses: { 200: { description: 'Proxied response' } },
            }),
            async (c) => {
                return proxyService.proxyRequest(c);
            })
        .patch('/*',
            describeRoute({
                description: 'Proxy PATCH requests to OpenCode API',
                tags: ['Proxy'],
                responses: { 200: { description: 'Proxied response' } },
            }),
            async (c) => {
                return proxyService.proxyRequest(c);
            })
        .delete('/*',
            describeRoute({
                description: 'Proxy DELETE requests to OpenCode API',
                tags: ['Proxy'],
                responses: { 200: { description: 'Proxied response' } },
            }),
            async (c) => {
                return proxyService.proxyRequest(c);
            })
        .options('/*', (c) => {
            const headers = Object.fromEntries(Object.entries({
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': '*',
            }));
            return c.body(null, 204, headers);
        });
}