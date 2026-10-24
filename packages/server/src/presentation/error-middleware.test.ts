import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { ConflictError, NotFoundError } from "../shared/domain-error";
import { onError } from "./error-middleware";

function createApp(error: unknown) {
  const app = new Hono();
  app.get("/", (c) => onError(error, c));
  return app;
}

describe("onError", () => {
  it("maps domain errors to their status and public message", async () => {
    const response = await createApp(
      new NotFoundError("Missing record"),
    ).request("/");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Missing record" });
  });

  it("supports domain error categories with conflict status", async () => {
    const response = await createApp(
      new ConflictError("Already exists"),
    ).request("/");

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Already exists" });
  });

  it("preserves HTTPException status and response", async () => {
    const response = await createApp(
      new HTTPException(403, { message: "Forbidden" }),
    ).request("/");

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("Forbidden");
  });

  it("logs and sanitizes unexpected errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await createApp(
      new Error("private database detail"),
    ).request("/");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("sanitizes non-Error thrown values", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await createApp("secret value").request("/");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    log.mockRestore();
  });
});
