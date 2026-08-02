import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { PtyModel } from "./pty.model";
import type { PtyService } from "./pty.service";

const idParamSchema = z.object({ id: z.string().min(1) });

/**
 * REST surface for PTY sessions. The bidirectional byte stream lives on a
 * WebSocket at `/api/pty/sessions/:id/stream` (see `attachPtyWebSockets`);
 * these routes handle lifecycle (spawn, resize, kill, status) and shell
 * discovery.
 */
export function createPtyController(service: PtyService) {
  return new Hono()
    .get(
      "/shells",
      describeRoute({
        description: "List shell binaries available for new PTY sessions",
        tags: ["PTY"],
        responses: { 200: { description: "Available shells" } },
      }),
      (c) => c.json(service.listShells()),
    )
    .post(
      "/sessions",
      describeRoute({
        description: "Spawn a new PTY session",
        tags: ["PTY"],
        responses: {
          201: { description: "Session created" },
          400: { description: "Invalid input" },
        },
      }),
      zValidator("json", PtyModel.createSessionSchema),
      async (c) => {
        const input = c.req.valid("json");
        const created = service.createSession(input);
        return c.json(created, 201);
      },
    )
    .get(
      "/sessions/:id",
      describeRoute({
        description: "Get the status of a PTY session",
        tags: ["PTY"],
        responses: {
          200: { description: "Session status" },
          404: { description: "Session not found" },
        },
      }),
      zValidator("param", idParamSchema),
      (c) => {
        const { id } = c.req.valid("param");
        return c.json(service.getSession(id));
      },
    )
    .post(
      "/sessions/:id/resize",
      describeRoute({
        description: "Resize the PTY for the given session",
        tags: ["PTY"],
        responses: {
          204: { description: "Resized" },
          404: { description: "Session not found" },
        },
      }),
      zValidator("param", idParamSchema),
      zValidator("json", PtyModel.resizeSchema),
      (c) => {
        const { id } = c.req.valid("param");
        const input = c.req.valid("json");
        service.resize(id, input);
        return c.body(null, 204);
      },
    )
    .delete(
      "/sessions/:id",
      describeRoute({
        description: "Kill and remove a PTY session",
        tags: ["PTY"],
        responses: {
          204: { description: "Session killed" },
          404: { description: "Session not found" },
        },
      }),
      zValidator("param", idParamSchema),
      (c) => {
        const { id } = c.req.valid("param");
        service.kill(id);
        return c.body(null, 204);
      },
    );
}
