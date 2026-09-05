import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useWindowFocus } from "@/hooks";
import { env } from "@/config/env";
import { notificationKeys } from "@/lib/cloudy/query-keys";
import {
  notificationDtoSchema,
  type Notification,
} from "@/lib/cloudy/notifications";

const wsFrameSchema = z.union([
  z.object({
    type: z.literal("snapshot"),
    notifications: z.array(notificationDtoSchema),
  }),
  z.object({
    type: z.literal("notification.created"),
    notification: notificationDtoSchema,
  }),
  z.object({ type: z.literal("notification.deleted"), id: z.string() }),
  z.object({ type: z.literal("notifications.cleared") }),
]);

export type NotificationWsFrame = z.infer<typeof wsFrameSchema>;

/**
 * Pure cache updater for notifications WS frames. Unknown or malformed
 * frames leave the cache untouched; `notification.created` is idempotent
 * (dedupes by id) because the REST POST response and the WS broadcast can
 * both write the same notification.
 */
export function applyNotificationFrame(
  current: Notification[] | undefined,
  raw: unknown,
): Notification[] | undefined {
  const parsed = wsFrameSchema.safeParse(raw);
  if (!parsed.success) return current;
  const frame = parsed.data;

  switch (frame.type) {
    case "snapshot":
      return frame.notifications;
    case "notification.created": {
      const notification = frame.notification;
      if (!current) return [notification];
      if (current.some((n) => n.id === notification.id)) {
        return current.map((n) =>
          n.id === notification.id ? notification : n,
        );
      }
      return [notification, ...current];
    }
    case "notification.deleted":
      return (current ?? []).filter((n) => n.id !== frame.id);
    case "notifications.cleared":
      return [];
  }
}

function buildNotificationsWsUrl(): string {
  const base = env.getApiUrl().replace(/\/$/, "");
  const wsBase = base.replace(/^http:/i, "ws:").replace(/^https:/i, "wss:");
  return `${wsBase}/api/notifications/ws`;
}

const MAX_BACKOFF_MS = 30_000;

/**
 * Subscribe once to the cloudy notifications WebSocket
 * (`GET /api/notifications/ws`) and mirror frames into the
 * `notificationKeys.list()` query cache. Reconnects with exponential
 * backoff and re-attempts when the window regains focus while closed.
 */
export function useNotificationsStream() {
  const queryClient = useQueryClient();
  const [reconnectTick, setReconnectTick] = useState(0);
  const focused = useWindowFocus();
  const prevFocused = useRef(focused);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!prevFocused.current && focused) {
      const ws = wsRef.current;
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        setReconnectTick((t) => t + 1);
      }
    }
    prevFocused.current = focused;
  }, [focused]);

  useEffect(() => {
    let disposed = false;
    let ws: WebSocket | null = null;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (disposed) return;
      ws = new WebSocket(buildNotificationsWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        retryCount = 0;
      };

      ws.onmessage = (e) => {
        let raw: unknown;
        try {
          raw = JSON.parse(e.data);
        } catch {
          return;
        }
        queryClient.setQueryData<Notification[] | undefined>(
          notificationKeys.list(),
          (current) => applyNotificationFrame(current, raw),
        );
      };

      ws.onclose = () => {
        if (disposed) return;
        const delay = Math.min(1000 * 2 ** retryCount, MAX_BACKOFF_MS);
        retryCount += 1;
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        if (
          ws.readyState === WebSocket.OPEN ||
          ws.readyState === WebSocket.CONNECTING
        ) {
          ws.close();
        }
      }
      wsRef.current = null;
    };
  }, [queryClient, reconnectTick]);
}
