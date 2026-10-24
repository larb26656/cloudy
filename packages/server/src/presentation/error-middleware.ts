import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { HTTPException } from "hono/http-exception";
import { DomainError } from "../shared/domain-error";

/**
 * Translate service errors at the HTTP boundary while keeping services framework-free.
 *
 * Exposed as a plain function rather than a `MiddlewareHandler` because Hono
 * dispatches errors through `app.onError`, not by rejecting the middleware
 * `next()` chain.
 */
export function onError(err: unknown, c: Context): Response {
  if (err instanceof DomainError) {
    return c.json(
      { error: err.message },
      { status: err.status as ContentfulStatusCode },
    );
  }
  if (err instanceof HTTPException) {
    const response = err.getResponse();
    const headers = new Headers(c.res.headers);
    response.headers.forEach((value, key) => headers.set(key, value));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  console.error("Unhandled server error", err);
  return c.json({ error: "Internal Server Error" }, { status: 500 });
}
