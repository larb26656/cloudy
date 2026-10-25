import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const automations = sqliteTable("automations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  providerInstanceId: text("provider_instance_id").notNull(),
  agentId: text("agent_id"),
  model: text("model", { mode: "json" }).$type<{
    providerId: string;
    modelId: string;
  }>(),
  directoryMode: text("directory_mode", {
    enum: ["temp", "specified"],
  }).notNull(),
  directoryPath: text("directory_path"),
  schedule: text("schedule", { mode: "json" }).$type<{
    cron: string;
    timezone: string;
    enabled: boolean;
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type AutomationRecord = typeof automations.$inferSelect;
export type NewAutomation = typeof automations.$inferInsert;
