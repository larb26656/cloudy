import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const cloudyMessages = sqliteTable(
  "cloudy_messages",
  {
    id: text("id").primaryKey(),
    providerSessionId: text("provider_session_id").notNull(),
    role: text("role").notNull(),
    parts: text("parts", { mode: "json" }).$type<unknown[]>().notNull(),
    error: text("error", { mode: "json" }).$type<unknown>(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (table) => [
    index("cloudy_messages_session_created_index").on(
      table.providerSessionId,
      table.createdAt,
      table.id,
    ),
  ],
);

export type CloudyMessageRecord = typeof cloudyMessages.$inferSelect;
export type NewCloudyMessage = typeof cloudyMessages.$inferInsert;
