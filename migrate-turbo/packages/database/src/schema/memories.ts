import { text, timestamp, pgTable } from "drizzle-orm/pg-core";

export const memories = pgTable("memories", {
  id: text("id").primaryKey(),
  title: text("title"),
  content: text("content").notNull(),
  tags: text("tags").array().default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type MemoryRecord = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
