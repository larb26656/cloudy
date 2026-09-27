import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id").notNull(),
    providerSessionId: text("provider_session_id").notNull(),
    title: text("title"),
    directory: text("directory"),
    parentId: text("parent_id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
    metadata: text("metadata", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
  },
  (table) => [
    uniqueIndex("sessions_provider_session_unique").on(
      table.providerId,
      table.providerSessionId,
    ),
    index("sessions_recent_index").on(table.updatedAt),
  ],
);

export type SessionRecord = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
