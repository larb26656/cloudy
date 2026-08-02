import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { HTTPException } from "hono/http-exception";
import { DomainError } from "../shared/domain-error";

/**
 * Translate `DomainError` subclasses (thrown from the service layer) into HTTP
 * responses. Anything else — including Hono's own `HTTPException` — is allowed
 * to propagate so the framework can render it. Keeping this translation at the
 * HTTP edge is what lets services stay framework-free.
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
  if (err instanceof HTTPException) return err.getResponse();
  const message = err instanceof Error ? err.message : "Internal error";
  return c.json(
    { error: "Internal error", message },
    { status: 500 },
  );
}
