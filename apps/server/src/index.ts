import { Elysia } from "elysia";

import openapi from "@elysiajs/openapi";
import { serve } from "./features/serve";
import { idea } from "./features/idea";
import { memory } from "./features/memory";
import cors from "@elysiajs/cors";

const app = new Elysia()
  .use(cors())
  .use(openapi())
  .get("/", () => "Hello Elysia")
  .use(serve)
  .use(idea)
  .use(memory)
  .listen(3001)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;