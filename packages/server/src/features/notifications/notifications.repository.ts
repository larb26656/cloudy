import { eq, inArray, sql } from "drizzle-orm";
import type { DbClient } from "../../db/client";
import { notifications } from "../../db/schema";
import type {
  CreateNotificationInput,
  NotificationDto,
} from "./notifications.model";

/**
 * Drizzle-only persistence layer for notifications. Maps DB rows → DTOs.
 * Throws plain `Error` for unexpected internal failures; returns `null` /
 * `false` for misses so the service can decide the HTTP status. Sync —
 * `better-sqlite3` is sync.
 */
export interface NotificationsRepository {
  list(): NotificationDto[];
  findById(id: string): NotificationDto | null;
  create(input: CreateNotificationInput & { id: string }): NotificationDto;
  delete(id: string): boolean;
  deleteAll(): void;
  /** Drop everything past `limit` newest rows. Returns the deleted ids. */
  pruneToLimit(limit: number): string[];
}

function toDto(row: typeof notifications.$inferSelect): NotificationDto {
  return {
    id: row.id,
    type: row.type as NotificationDto["type"],
    title: row.title,
    message: row.message,
    metadata: (row.metadata ?? null) as Record<string, string> | null,
    createdAt: row.createdAt,
  };
}

export function createNotificationsRepository(
  db: DbClient,
): NotificationsRepository {
  const list = (): NotificationDto[] =>
    db
      .select()
      .from(notifications)
      // rowid is SQLite insert order — the reliable tiebreaker because
      // unixepoch() only has second resolution, so bursts tie on created_at.
      .orderBy(sql`created_at DESC, rowid DESC`)
      .all()
      .map(toDto);

  const findById = (id: string): NotificationDto | null => {
    const row = db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .get();
    return row ? toDto(row) : null;
  };

  const create = (
    input: CreateNotificationInput & { id: string },
  ): NotificationDto => {
    const result = db
      .insert(notifications)
      .values({
        id: input.id,
        type: input.type,
        title: input.title,
        message: input.message,
        metadata: input.metadata ?? null,
      })
      .returning()
      .get();
    return toDto(result);
  };

  const remove = (id: string): boolean => {
    const result = db
      .delete(notifications)
      .where(eq(notifications.id, id))
      .run();
    return result.changes > 0;
  };

  const deleteAll = (): void => {
    db.delete(notifications).run();
  };

  const pruneToLimit = (limit: number): string[] => {
    const doomed = db
      .all<{ id: string }>(
        sql`SELECT id FROM notifications WHERE id NOT IN (
          SELECT id FROM notifications ORDER BY created_at DESC, rowid DESC LIMIT ${limit}
        )`,
      )
      .map((row) => row.id);
    if (doomed.length === 0) return [];
    db.delete(notifications).where(inArray(notifications.id, doomed)).run();
    return doomed;
  };

  return {
    list,
    findById,
    create,
    delete: remove,
    deleteAll,
    pruneToLimit,
  };
}
