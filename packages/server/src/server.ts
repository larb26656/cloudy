import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { relative } from "node:path";
import { openAPIRouteHandler } from "hono-openapi";
import { Scalar } from "@scalar/hono-api-reference";

import { createPtyController } from "./features/pty";
import { createNotificationsController } from "./features/notifications";
import { createWorkspacesController } from "./features/workspaces";
import { createBrowserWorkspaceController } from "./features/browser-workspace";
import { createAgentProvidersController } from "./features/providers";
import { createSessionsController } from "./features/sessions";
import {
  createAgentProviderSettingsController,
  createAgentsController,
} from "./features/settings";
import { createLLMConnectionsController } from "./features/llm-connections";
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
  const corsMiddleware = cors({
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
    ],
    credentials: true,
  });
  const app = new Hono()
    .use((c, next) =>
      c.req.header("upgrade")?.toLowerCase() === "websocket"
        ? next()
        : corsMiddleware(c, next),
    )
    .onError(domainErrorHandler)
    .get("/api/health", (c) => c.json({ status: "ok" }))
    .route(
      "/api/agent-providers",
      createAgentProvidersController(
        container.agentProviderRegistry,
        container.providerEventHub,
        container.sessionsService,
      ),
    )
    .route("/api/sessions", createSessionsController(container.sessionsService))
    .route("/api/settings", createAgentsController(container.agentsService))
    .route(
      "/api/settings",
      createAgentProviderSettingsController(
        container.agentProviderSettingsService,
      ),
    )
    .route(
      "/api/llm-connections",
      createLLMConnectionsController(
        container.llmConnectionsService,
        container.chatgptPlanService,
      ),
    )
    .route("/api/pty", createPtyController(container.ptyService))
    .route(
      "/api/workspaces",
      createWorkspacesController(container.workspacesService),
    )
    .route(
      "/api/browser-workspace",
      createBrowserWorkspaceController(container.browserWorkspaceService),
    )
    .route(
      "/api/notifications",
      createNotificationsController(container.notificationsService),
    );

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
