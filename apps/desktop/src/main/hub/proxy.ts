import { proxy } from "hono/proxy";
import { Hono } from "hono";
import type { DesktopConfig } from "../config";
import { getServerUrl } from "../config";

export function createProxyRoutes(
  getConfig: () => DesktopConfig
) {
  const app = new Hono();

  app.all("/proxy/*", async (c) => {
    const config = getConfig();
    const path = c.req.path.replace(/^\/proxy\//, "");
    const baseUrl = getServerUrl(config);
    const target = `${baseUrl}/${path}`;

    const req = c.req.raw;
    const res = await proxy(target, {
      method: req.method,
      headers: {
        ...c.req.header(),
        "X-Forwarded-For": c.req.header("host") || "127.0.0.1",
        "X-Forwarded-Host": c.req.header("host"),
      },
      body: req.body,
      signal: req.signal,
    });

    return new Response(res.body, {
      status: res.status,
      headers: res.headers,
    });
  });

  return app;
}