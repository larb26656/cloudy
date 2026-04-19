import { Elysia } from "elysia";
import openapi from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";
import { serve } from "./features/serve";
import { idea } from "./features/idea";
import { memory } from "./features/memory";
import { artifact } from "./features/artifact";
import { proxy } from "./features/proxy";
import cors from "@elysiajs/cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PUBLIC_DIR = __dirname.endsWith("/dist")
    ? join(__dirname, "public")
    : join(__dirname, "../", "public");

export function createServer({ corsOrigins = [], enableUI = false }: {
    corsOrigins?: string[];
    enableUI?: boolean;
}) {
    return new Elysia()
        .use(cors({
            origin: corsOrigins
        }))
        .get("/", ({ status }) => {
            if (!enableUI) return status(404);

            return new Response(Bun.file(join(PUBLIC_DIR, "index.html")), {
                headers: { "Content-Type": "text/html" }
            });
        })
        .use(
            enableUI
                ? staticPlugin({
                    assets: PUBLIC_DIR,
                    prefix: "/",
                    alwaysStatic: true,
                })
                : new Elysia()
        )
        .use(openapi())
        .use(proxy)
        .group("/api", (app) =>
            app
                .use(openapi())
                .use(serve)
                .use(idea)
                .use(memory)
                .use(artifact)
        )
        .get('/*', ({ status }) => {

            if (!enableUI) return status(404);

            return Bun.file(join(PUBLIC_DIR, "index.html"));

        })
}

export type App = ReturnType<typeof createServer>;
