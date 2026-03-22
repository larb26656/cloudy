import { Elysia } from "elysia";
import openapi from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";
import { serve } from "./features/serve";
import { idea } from "./features/idea";
import { memory } from "./features/memory";
import { proxy } from "./features/proxy";
import cors from "@elysiajs/cors";

const app = new Elysia()
    .use(cors())
    .get("/", () => new Response(Bun.file("public/index.html"), {
        headers: { "Content-Type": "text/html" }
    }))
    .use(staticPlugin({
        assets: "public",
        prefix: "",
        indexHTML: false
    }))
    .use(openapi())
    .use(serve)
    .use(idea)
    .use(memory)
    .use(proxy)
    .listen(3000)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
