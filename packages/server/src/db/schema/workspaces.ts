import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Workspace chat surface types. `"agent"` is the full IDE-like chat;
 * `"bot"` renders the stripped-down bot chat (BotChatContainer).
 */
export const workspaceTypes = ["agent", "bot"] as const;
export type WorkspaceType = (typeof workspaceTypes)[number];

/**
 * Workspaces table. Mirrors the frontend `Workspace` shape minus the dead
 * `instanceId` field. `directory` is unique to enforce dup-check semantics
 * without application-level locking.
 */
export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  type: text("type", { enum: workspaceTypes }).notNull().default("agent"),
  directory: text("directory").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type WorkspaceRecord = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
