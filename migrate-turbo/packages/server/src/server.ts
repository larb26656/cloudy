import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'url'
import { dirname } from 'node:path'
import { openAPIRouteHandler } from 'hono-openapi'
import { Scalar } from '@scalar/hono-api-reference'

import { createIdeaApp } from './features/idea'
import { createMemoryApp } from './features/memory'
import { createArtifactApp } from './features/artifact'
import { createProxyApp } from './features/proxy'
import { memoryService, ideaService, artifactService, proxyService, ideaFileService } from './container'

const getDirname = () => {
    try {
        return dirname(fileURLToPath(import.meta.url))
    } catch {
        return process.cwd()
    }
}

const __dirname = getDirname()

const PUBLIC_DIR = join(__dirname, 'public')

export function createApp({ corsOrigins = [], enableUI = false }: {
    corsOrigins?: string[]
    enableUI?: boolean
}) {
    const app = new Hono()
        .use(cors({
            origin: corsOrigins,
            allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowHeaders: ['*'],
        }))
        .get('/', (c) => {
            if (!enableUI) return c.notFound()
            const indexPath = join(PUBLIC_DIR, "index.html")
            if (!existsSync(indexPath)) return c.notFound()
            const content = readFileSync(indexPath, 'utf-8')
            return c.html(content)
        })
        .get('/api/health', (c) => c.json({ status: 'ok' }))
        .route('/api/idea', createIdeaApp({ ideaService, ideaFileService }))
        .route('/api/memory', createMemoryApp({ memoryService }))
        .route('/api/artifact', createArtifactApp({ artifactService }))
        .route('/oc', createProxyApp({ proxyService }))

    app.get('/openapi', openAPIRouteHandler(app, {
        documentation: {
            info: { title: 'Cloudy API', version: '1.0.0' },
        },
    }))

    app.use('/docs', (c, next) => Scalar({ spec: { url: '/openapi' } })(c, next))

    if (enableUI) {
        app.get('/*', (c) => {
            const indexPath = join(PUBLIC_DIR, "index.html")
            if (!existsSync(indexPath)) return c.notFound()
            const content = readFileSync(indexPath, 'utf-8')
            return c.html(content)
        })
    }

    return app
}

export type AppType = ReturnType<typeof createApp>