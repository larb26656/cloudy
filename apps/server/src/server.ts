import { Elysia } from "elysia";
import openapi from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";
import { serve } from "./features/serve";
import { idea } from "./features/idea";
import { memory } from "./features/memory";
import { artifact } from "./features/artifact";
import { proxyHandler } from "./container";
import cors from "@elysiajs/cors";

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

            return new Response(Bun.file("public/index.html"), {
                headers: { "Content-Type": "text/html" }
            });
        })
        .use(
            enableUI
                ? staticPlugin({
                    assets: "public",
                    prefix: "/",
                    alwaysStatic: true,

                })
                : new Elysia()
        )
        .use(openapi())
        .use(proxyHandler.getPlugin())
        .group("/api", (app) =>
            app
                .use(openapi())
                .use(serve)
                .use(idea)
                .use(memory)
                .use(artifact)
        )

        .use(
            enableUI
                ? staticPlugin({
                    assets: "public",
                    prefix: "/",
                    alwaysStatic: true,

                })
                : new Elysia()
        )
        .get('/*', ({ status }) => {

            if (!enableUI) return status(404);

            return Bun.file('public/index.html');

        })
}

export type App = ReturnType<typeof createServer>;
