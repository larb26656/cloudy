import type { WSContext, WSEvents } from "hono/ws";
import type { NotificationsService } from "./notifications.service";

type WsFrame =
  | { type: "snapshot"; notifications: unknown }
  | { type: "notification.created"; notification: unknown }
  | { type: "notification.deleted"; id: string }
  | { type: "notifications.cleared" };

/**
 * Wire a Hono WebSocket route to the notifications service. Server-push
 * only: on open the subscriber receives a `snapshot` of the current feed,
 * then `notification.created` / `notification.deleted` / `notifications.cleared`
 * frames as mutations happen. Clients never send frames — CRUD goes over REST.
 */
export function createNotificationsWebSocketEvents(
  service: NotificationsService,
): WSEvents {
  let offCreated: (() => void) | null = null;
  let offDeleted: (() => void) | null = null;
  let offCleared: (() => void) | null = null;

  const send = (ws: WSContext, frame: WsFrame) => {
    if (ws.readyState === 1) ws.send(JSON.stringify(frame));
  };

  const cleanup = () => {
    offCreated?.();
    offDeleted?.();
    offCleared?.();
    offCreated = null;
    offDeleted = null;
    offCleared = null;
  };

  return {
    onOpen(_event, ws) {
      send(ws, { type: "snapshot", notifications: service.list() });
      offCreated = service.onCreated((notification) =>
        send(ws, { type: "notification.created", notification }),
      );
      offDeleted = service.onDeleted((id) =>
        send(ws, { type: "notification.deleted", id }),
      );
      offCleared = service.onCleared(() =>
        send(ws, { type: "notifications.cleared" }),
      );
    },
    onClose() {
      cleanup();
    },
    onError() {
      cleanup();
    },
  };
}
