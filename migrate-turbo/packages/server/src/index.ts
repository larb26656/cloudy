import { Hono } from "hono";

const app = new Hono();

export const routes = app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export type App = typeof routes;
