import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import type { ProxyService } from "./proxy.service";

const CORS_PREFLIGHT_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
} as const;

/**
 * HTTP surface for the opencode proxy. Each method forwards `c.req.raw`
 * (plus a headers snapshot) into the framework-free service. OPTIONS is
 * handled inline because opencode clients preflight directly against `/oc`.
 */
export function createProxyController(service: ProxyService) {
  return new Hono()
    .get(
      "/*",
      describeRoute({
        description: "Proxy GET requests to OpenCode API",
        tags: ["Proxy"],
        responses: { 200: { description: "Proxied response" } },
      }),
      (c) => service.proxy(c.req.raw, c.req.header()),
    )
    .post(
      "/*",
      describeRoute({
        description: "Proxy POST requests to OpenCode API",
        tags: ["Proxy"],
        responses: { 200: { description: "Proxied response" } },
      }),
      (c) => service.proxy(c.req.raw, c.req.header()),
    )
    .put(
      "/*",
      describeRoute({
        description: "Proxy PUT requests to OpenCode API",
        tags: ["Proxy"],
        responses: { 200: { description: "Proxied response" } },
      }),
      (c) => service.proxy(c.req.raw, c.req.header()),
    )
    .patch(
      "/*",
      describeRoute({
        description: "Proxy PATCH requests to OpenCode API",
        tags: ["Proxy"],
        responses: { 200: { description: "Proxied response" } },
      }),
      (c) => service.proxy(c.req.raw, c.req.header()),
    )
    .delete(
      "/*",
      describeRoute({
        description: "Proxy DELETE requests to OpenCode API",
        tags: ["Proxy"],
        responses: { 200: { description: "Proxied response" } },
      }),
      (c) => service.proxy(c.req.raw, c.req.header()),
    )
    .options("/*", (c) => c.body(null, 204, CORS_PREFLIGHT_HEADERS));
}
