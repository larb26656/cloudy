import { describe, it, expect, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { createNotificationsService } from "./notifications.service";
import type { NotificationsRepository } from "./notifications.repository";
import type { NotificationDto } from "./notifications.model";
import { NotificationNotFoundError } from "./notifications.errors";

function makeNotification(
  overrides: Partial<NotificationDto> = {},
): NotificationDto {
  return {
    id: "n-1",
    type: "info",
    title: "Title",
    message: "message",
    metadata: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function makeRepo() {
  return mock<NotificationsRepository>();
}

describe("NotificationsService", () => {
  it("list returns repository rows", () => {
    const repo = makeRepo();
    const seed = [makeNotification(), makeNotification({ id: "n-2" })];
    repo.list.mockReturnValue(seed);
    const service = createNotificationsService(repo);
    expect(service.list()).toEqual(seed);
  });

  it("create inserts with a generated uuid and emits onCreated", () => {
    const repo = makeRepo();
    const created = makeNotification({ id: "generated" });
    repo.create.mockReturnValue(created);
    repo.pruneToLimit.mockReturnValue([]);
    const onCreated = vi.fn();
    const service = createNotificationsService(repo);
    service.onCreated(onCreated);

    const result = service.create({
      type: "success",
      title: "Done",
      message: "it worked",
      metadata: { source: "opencode" },
    });

    expect(result).toBe(created);
    const [input] = repo.create.mock.calls[0]!;
    expect(input.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(onCreated).toHaveBeenCalledExactlyOnceWith(created);
  });

  it("create prunes past the limit and emits onDeleted per pruned id", () => {
    const repo = makeRepo();
    repo.create.mockReturnValue(makeNotification());
    repo.pruneToLimit.mockReturnValue(["n-old-1", "n-old-2"]);
    const onDeleted = vi.fn();
    const service = createNotificationsService(repo);
    service.onDeleted(onDeleted);

    service.create({ type: "info", title: "t", message: "m" });

    expect(repo.pruneToLimit).toHaveBeenCalledExactlyOnceWith(30);
    expect(onDeleted).toHaveBeenNthCalledWith(1, "n-old-1");
    expect(onDeleted).toHaveBeenNthCalledWith(2, "n-old-2");
  });

  it("delete removes when found and emits onDeleted", () => {
    const repo = makeRepo();
    repo.delete.mockReturnValue(true);
    const onDeleted = vi.fn();
    const service = createNotificationsService(repo);
    service.onDeleted(onDeleted);

    expect(() => service.delete("n-1")).not.toThrow();
    expect(onDeleted).toHaveBeenCalledExactlyOnceWith("n-1");
  });

  it("delete throws NotificationNotFoundError on miss", () => {
    const repo = makeRepo();
    repo.delete.mockReturnValue(false);
    const service = createNotificationsService(repo);
    expect(() => service.delete("nope")).toThrow(NotificationNotFoundError);
    expect(() => service.delete("nope")).toThrow(
      expect.objectContaining({ status: 404 }),
    );
  });

  it("clear empties the repository and emits onCleared", () => {
    const repo = makeRepo();
    const onCleared = vi.fn();
    const service = createNotificationsService(repo);
    service.onCleared(onCleared);

    service.clear();

    expect(repo.deleteAll).toHaveBeenCalledOnce();
    expect(onCleared).toHaveBeenCalledOnce();
  });

  it("unsubscribe stops delivery", () => {
    const repo = makeRepo();
    repo.create.mockReturnValue(makeNotification());
    repo.pruneToLimit.mockReturnValue([]);
    const onCreated = vi.fn();
    const service = createNotificationsService(repo);
    const off = service.onCreated(onCreated);
    off();

    service.create({ type: "info", title: "t", message: "m" });

    expect(onCreated).not.toHaveBeenCalled();
  });
});
