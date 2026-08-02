import { proxy as proxyFetch } from "hono/proxy";
import { MissingApiBaseError } from "./proxy.errors";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
} as const;

/**
 * Outbound proxy to the opencode API. Framework-free — accepts a plain
 * `Request` and returns a plain `Response`; the controller is responsible for
 * adapting Hono's `c.req.raw` / `c.req.header()` into this shape.
 */
export function createProxyService(defaultApiBase: string = "") {
  const proxy = async (request: Request, requestHeaders: Record<string, string>): Promise<Response> => {
    if (!defaultApiBase) throw new MissingApiBaseError();

    const incomingUrl = new URL(request.url);
    const targetPath = incomingUrl.pathname.replace(/^\/oc/, "");
    const targetUrl = new URL(targetPath + incomingUrl.search, defaultApiBase);

    const res = await proxyFetch(targetUrl.toString(), {
      method: request.method,
      headers: {
        ...requestHeaders,
        "X-Forwarded-For": requestHeaders["host"] || "127.0.0.1",
        "X-Forwarded-Host": requestHeaders["host"],
        Authorization: undefined,
      },
      body: request.body,
      signal: request.signal,
    });

    res.headers.delete("Set-Cookie");

    const contentType = res.headers.get("content-type") || "";

    return new Response(res.body, {
      status: res.status,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        ...Object.fromEntries(Object.entries(CORS_HEADERS)),
      },
    });
  };

  return { proxy };
}

export type ProxyService = ReturnType<typeof createProxyService>;
