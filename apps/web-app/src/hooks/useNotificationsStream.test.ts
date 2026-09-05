import { describe, test, expect, vi } from "vitest";
import { applyNotificationFrame } from "./useNotificationsStream";
import type { Notification } from "@/lib/cloudy/notifications";

vi.mock("@/config/env", () => ({
  env: { getApiUrl: () => "http://localhost:4122" },
}));

function createNotification(
  overrides: Partial<Notification> = {},
): Notification {
  return {
    id: "ntf_1",
    type: "info",
    title: "Question asked",
    message: "/demo/project",
    metadata: { source: "opencode" },
    createdAt: new Date("2026-08-21T00:00:00Z"),
    ...overrides,
  };
}

describe("applyNotificationFrame", () => {
  test("snapshot replaces the cache and coerces createdAt", () => {
    const result = applyNotificationFrame(undefined, {
      type: "snapshot",
      notifications: [
        {
          id: "ntf_1",
          type: "info",
          title: "Question asked",
          message: "",
          metadata: null,
          createdAt: "2026-08-21T00:00:00.000Z",
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result![0]!.id).toBe("ntf_1");
    expect(result![0]!.createdAt).toBeInstanceOf(Date);
  });

  test("notification.created prepends to existing list", () => {
    const existing = createNotification({ id: "ntf_old" });
    const created = createNotification({ id: "ntf_new" });

    const result = applyNotificationFrame([existing], {
      type: "notification.created",
      notification: created,
    });

    expect(result).toHaveLength(2);
    expect(result![0]!.id).toBe("ntf_new");
    expect(result![1]!.id).toBe("ntf_old");
  });

  test("notification.created seeds the cache when empty", () => {
    const created = createNotification();

    const result = applyNotificationFrame(undefined, {
      type: "notification.created",
      notification: created,
    });

    expect(result).toEqual([created]);
  });

  test("notification.created dedupes by id", () => {
    const existing = createNotification({ id: "ntf_1", title: "Old title" });
    const created = createNotification({ id: "ntf_1", title: "New title" });

    const result = applyNotificationFrame([existing], {
      type: "notification.created",
      notification: created,
    });

    expect(result).toHaveLength(1);
    expect(result![0]!.title).toBe("New title");
  });

  test("notification.deleted filters by id", () => {
    const a = createNotification({ id: "ntf_a" });
    const b = createNotification({ id: "ntf_b" });

    const result = applyNotificationFrame([a, b], {
      type: "notification.deleted",
      id: "ntf_a",
    });

    expect(result).toEqual([b]);
  });

  test("notifications.cleared empties the cache", () => {
    const a = createNotification({ id: "ntf_a" });

    const result = applyNotificationFrame([a], {
      type: "notifications.cleared",
    });

    expect(result).toEqual([]);
  });

  test("malformed frame leaves the cache untouched", () => {
    const existing = [createNotification()];

    expect(applyNotificationFrame(existing, { type: "nope" })).toBe(existing);
    expect(applyNotificationFrame(existing, "garbage")).toBe(existing);
    expect(applyNotificationFrame(existing, null)).toBe(existing);
  });

  test("notification.created with invalid payload leaves the cache untouched", () => {
    const existing = [createNotification()];

    const result = applyNotificationFrame(existing, {
      type: "notification.created",
      notification: { id: "ntf_x" },
    });

    expect(result).toBe(existing);
  });

  test("notification.deleted on empty cache yields empty list", () => {
    const result = applyNotificationFrame(undefined, {
      type: "notification.deleted",
      id: "ntf_a",
    });

    expect(result).toEqual([]);
  });
});
