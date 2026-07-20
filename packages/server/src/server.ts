import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { relative } from "node:path";
import { openAPIRouteHandler } from "hono-openapi";
import { Scalar } from "@scalar/hono-api-reference";

import { createProxyApp } from "./features/proxy";
import { proxyService } from "./container";

export function createApp({
  corsOrigins = [] as string[] | "*",
  enableUI = false,
  publicDir,
}: {
  corsOrigins?: string[] | "*";
  enableUI?: boolean;
  publicDir?: string;
}) {
  const app = new Hono()
    .use(
      cors({
        origin: corsOrigins.length ? corsOrigins : "*",
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["*"],
      }),
    )
    .get("/api/health", (c) => c.json({ status: "ok" }))
    .route("/oc", createProxyApp({ proxyService }));

  app.get(
    "/openapi",
    openAPIRouteHandler(app, {
      documentation: {
        info: { title: "Cloudy API", version: "1.0.0" },
      },
    }),
  );

  app.use("/docs", (c, next) => Scalar({ spec: { url: "/openapi" } })(c, next));

  if (enableUI && publicDir) {
    const relRoot = relative(process.cwd(), publicDir);
    app.get("/*", serveStatic({ root: relRoot }));
    app.get("/*", serveStatic({ root: relRoot, path: "index.html" }));
  }

  return app;
}

export type AppType = ReturnType<typeof createApp>;
