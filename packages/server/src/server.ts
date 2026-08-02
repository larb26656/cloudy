import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { relative } from "node:path";
import { openAPIRouteHandler } from "hono-openapi";
import { Scalar } from "@scalar/hono-api-reference";

import { createProxyController } from "./features/proxy";
import { createPtyController } from "./features/pty";
import { createWorkspacesController } from "./features/workspaces";
import type { Container } from "./container";
import { onError as domainErrorHandler } from "./presentation/error-middleware";

export function createApp({
  corsOrigins = [] as string[] | "*",
  enableUI = false,
  publicDir,
  container,
}: {
  corsOrigins?: string[] | "*";
  enableUI?: boolean;
  publicDir?: string;
  container: Container;
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
          "x-opencode-directory",
        ],
        credentials: true,
      }),
    )
    .onError(domainErrorHandler)
    .get("/api/health", (c) => c.json({ status: "ok" }))
    .route("/oc", createProxyController(container.proxyService))
    .route("/api/pty", createPtyController(container.ptyService))
    .route("/api/workspaces", createWorkspacesController(container.workspacesService));

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
