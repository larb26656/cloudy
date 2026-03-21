import { Elysia } from "elysia";
import { serve } from "./features/serve";

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .use(serve)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
