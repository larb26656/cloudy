import { Hono } from "hono";
import { cors } from "hono/cors";
import type { HubContextStore } from "./context-store";
import type { AddContextOptions } from "./types";

export function createHubRouter(store: HubContextStore): Hono {
  const app = new Hono();

  app.use("/*", cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["*"],
  }));

  app.post("/context", async (c) => {
    const body = await c.req.json<AddContextOptions>();
    const result = store.add(body);
    return c.json(result);
  });

  app.delete("/context/:id", (c) => {
    const id = c.req.param("id");
    const deleted = store.remove(id);
    if (!deleted) {
      return c.json({ error: "not found" }, 404);
    }
    return c.json({ status: "deleted" });
  });

  app.get("/contexts", (c) => {
    return c.json({ contexts: store.list() });
  });

  return app;
}
