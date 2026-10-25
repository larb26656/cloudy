import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { automations } from "./automations";

export const automationRuns = sqliteTable(
  "automation_runs",
  {
    id: text("id").primaryKey(),
    automationId: text("automation_id")
      .notNull()
      .references(() => automations.id, { onDelete: "cascade" }),
    trigger: text("trigger", { enum: ["manual", "schedule"] }).notNull(),
    scheduledFor: integer("scheduled_for", { mode: "timestamp" }),
    state: text("state", {
      enum: [
        "pending",
        "running",
        "succeeded",
        "failed",
        "skipped",
        "interrupted",
      ],
    }).notNull(),
    phase: text("phase", { enum: ["working", "send_to_log"] }),
    sessionId: text("session_id"),
    output: text("output"),
    error: text("error"),
    reason: text("reason"),
    configSnapshot: text("config_snapshot", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull(),
    ownerId: text("owner_id"),
    leaseExpiresAt: integer("lease_expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    startedAt: integer("started_at", { mode: "timestamp" }),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
  },
  (table) => [
    index("automation_runs_history_index").on(
      table.automationId,
      table.createdAt,
    ),
    uniqueIndex("automation_runs_scheduled_slot_unique").on(
      table.automationId,
      table.scheduledFor,
    ),
    uniqueIndex("automation_runs_one_active_per_automation")
      .on(table.automationId)
      .where(sql`${table.state} in ('pending', 'running')`),
  ],
);

export type AutomationRunRecord = typeof automationRuns.$inferSelect;
export type NewAutomationRun = typeof automationRuns.$inferInsert;
