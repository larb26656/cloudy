import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'url'
import { dirname } from 'node:path'

import { serve as serveFeature } from './features/serve'
import { idea } from './features/idea'
import { memory } from './features/memory'
import { artifact } from './features/artifact'
import { proxy } from './features/proxy'

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

    app.use(cors({
        origin: corsOrigins,
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['*'],
    }))

    app.get('/', (c) => {
        if (!enableUI) return c.notFound()
        const indexPath = join(PUBLIC_DIR, "index.html")
        if (!existsSync(indexPath)) return c.notFound()
        const content = readFileSync(indexPath, 'utf-8')
        return c.html(content)
    })

    app.route('/oc', proxy)
    app.route('/api/idea', idea)
    app.route('/api/memory', memory)
    app.route('/api/artifact', artifact)
    app.route('/api/serve', serveFeature)

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

const app = createApp({ enableUI: true })

export { app }

export type AppType = typeof app