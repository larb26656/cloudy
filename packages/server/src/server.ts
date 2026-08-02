import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { relative } from "node:path";
import { openAPIRouteHandler } from "hono-openapi";
import { Scalar } from "@scalar/hono-api-reference";

import { createProxyApp } from "./features/proxy";
import { createPtyApp } from "./features/pty";
import { proxyService, ptyService } from "./container";

export function createApp({
  corsOrigins = [] as string[] | "*",
  enableUI = false,
  publicDir,
}: {
  corsOrigins?: string[] | "*";
  enableUI?: boolean;
  publicDir?: string;
}) {
  const allowedOrigins = corsOrigins === "*" ? [] : corsOrigins;
  const app = new Hono()
    .use(
      cors({
        // Browsers reject `Access-Control-Allow-Origin: *` when the request
        // sends credentials. Echo the request origin if it is in the allow
        // list; if no list was configured (dev default), allow any origin by
        // reflecting it back.
        origin: (origin) => {
          if (!origin) return null;
          if (allowedOrigins.length === 0) return origin;
          return allowedOrigins.includes(origin) ? origin : null;
        },
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "Accept",
          "Origin",
          "X-Requested-With",
          "x-opencode-api-base",
        ],
        credentials: true,
      }),
    )
    .get("/api/health", (c) => c.json({ status: "ok" }))
    .route("/oc", createProxyApp({ proxyService }))
    .route("/api/pty", createPtyApp({ ptyService }));

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
