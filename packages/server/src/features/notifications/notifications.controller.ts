import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { upgradeWebSocket } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { NotificationsModel } from "./notifications.model";
import type { NotificationsService } from "./notifications.service";
import { createNotificationsWebSocketEvents } from "./notifications.ws-adapter";

const idParamSchema = z.object({ id: z.string().min(1) });

/**
 * REST surface for notifications plus a server-push-only WebSocket at
 * `/api/notifications/ws`. The service throws `DomainError` subclasses that
 * the error middleware maps to HTTP status codes, so route handlers stay
 * thin — validate, delegate, shape the response.
 */
export function createNotificationsController(service: NotificationsService) {
  return new Hono()
    .get(
      "/",
      describeRoute({
        description: "List all notifications (newest first, capped at 30)",
        tags: ["Notifications"],
        responses: { 200: { description: "Notification list" } },
      }),
      (c) => c.json(service.list()),
    )
    .post(
      "/",
      describeRoute({
        description: "Create a notification (prunes history past 30 rows)",
        tags: ["Notifications"],
        responses: {
          201: { description: "Notification created" },
          400: { description: "Invalid input" },
        },
      }),
      zValidator("json", NotificationsModel.createNotificationSchema),
      (c) => {
        const input = c.req.valid("json");
        const created = service.create(input);
        return c.json(created, 201);
      },
    )
    .get(
      "/ws",
      upgradeWebSocket(() => createNotificationsWebSocketEvents(service)),
    )
    .delete(
      "/",
      describeRoute({
        description: "Clear all notifications",
        tags: ["Notifications"],
        responses: { 204: { description: "All notifications cleared" } },
      }),
      (c) => {
        service.clear();
        return c.body(null, 204);
      },
    )
    .delete(
      "/:id",
      describeRoute({
        description: "Delete a notification by id",
        tags: ["Notifications"],
        responses: {
          204: { description: "Notification deleted" },
          404: { description: "Notification not found" },
        },
      }),
      zValidator("param", idParamSchema),
      (c) => {
        const { id } = c.req.valid("param");
        service.delete(id);
        return c.body(null, 204);
      },
    );
}
