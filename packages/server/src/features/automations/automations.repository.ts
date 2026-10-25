import { and, desc, eq, lt, or } from "drizzle-orm";
import type { DbClient } from "../../db";
import {
  automations,
  automationRuns,
  type AutomationRecord,
  type AutomationRunRecord,
  type NewAutomation,
} from "../../db/schema";

export type RunClaim = {
  run: AutomationRunRecord;
  claimed: boolean;
};

export function createAutomationsRepository(db: DbClient) {
  const create = (input: NewAutomation): AutomationRecord =>
    db.insert(automations).values(input).returning().get();
  const findById = (id: string): AutomationRecord | null =>
    db.select().from(automations).where(eq(automations.id, id)).get() ?? null;
  const list = (): AutomationRecord[] =>
    db.select().from(automations).orderBy(desc(automations.createdAt)).all();
  const update = (
    id: string,
    input: Partial<Omit<NewAutomation, "id" | "createdAt">>,
  ): AutomationRecord | null =>
    db
      .update(automations)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(automations.id, id))
      .returning()
      .get() ?? null;
  const remove = (id: string): boolean =>
    db.delete(automations).where(eq(automations.id, id)).run().changes > 0;

  const listRuns = (automationId: string): AutomationRunRecord[] =>
    db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.automationId, automationId))
      .orderBy(desc(automationRuns.createdAt))
      .all();
  const findRunById = (
    automationId: string,
    runId: string,
  ): AutomationRunRecord | null =>
    db
      .select()
      .from(automationRuns)
      .where(
        and(
          eq(automationRuns.automationId, automationId),
          eq(automationRuns.id, runId),
        ),
      )
      .get() ?? null;
  const claimRun = (input: {
    id: string;
    automationId: string;
    trigger: "manual" | "schedule";
    scheduledFor?: Date;
    configSnapshot: Record<string, unknown>;
    ownerId: string;
    leaseExpiresAt: Date;
  }): RunClaim =>
    db.transaction(
      (tx) => {
        const now = new Date();
        if (input.trigger === "schedule" && input.scheduledFor) {
          const scheduled = tx
            .select()
            .from(automationRuns)
            .where(
              and(
                eq(automationRuns.automationId, input.automationId),
                eq(automationRuns.scheduledFor, input.scheduledFor),
              ),
            )
            .get();
          if (scheduled) return { run: scheduled, claimed: false };
        }
        const active = tx
          .select()
          .from(automationRuns)
          .where(
            and(
              eq(automationRuns.automationId, input.automationId),
              or(
                eq(automationRuns.state, "pending"),
                eq(automationRuns.state, "running"),
              ),
            ),
          )
          .get();
        if (active && active.leaseExpiresAt && active.leaseExpiresAt > now) {
          const skipped = tx
            .insert(automationRuns)
            .values({
              ...input,
              scheduledFor: input.scheduledFor,
              state: "skipped",
              reason: "Automation already has an active run",
              ownerId: null,
              leaseExpiresAt: null,
              finishedAt: now,
            })
            .returning()
            .get();
          return { run: skipped, claimed: false };
        }
        if (active)
          tx.update(automationRuns)
            .set({
              state: "interrupted",
              reason: "Execution lease expired",
              finishedAt: now,
              ownerId: null,
              leaseExpiresAt: null,
            })
            .where(eq(automationRuns.id, active.id))
            .run();
        const run = tx
          .insert(automationRuns)
          .values({
            ...input,
            scheduledFor: input.scheduledFor,
            state: "pending",
          })
          .returning()
          .get();
        return { run, claimed: true };
      },
      { behavior: "immediate" },
    );

  const transitionRun = (
    id: string,
    ownerId: string,
    state: "running" | "succeeded" | "failed" | "interrupted",
    input: {
      phase?: "working" | "send_to_log";
      sessionId?: string;
      output?: string;
      error?: string;
      reason?: string;
      leaseExpiresAt?: Date;
    } = {},
  ): AutomationRunRecord | null => {
    const now = new Date();
    return (
      db
        .update(automationRuns)
        .set({
          ...input,
          state,
          startedAt: state === "running" ? now : undefined,
          finishedAt: ["succeeded", "failed", "interrupted"].includes(state)
            ? now
            : undefined,
          ownerId: ["succeeded", "failed", "interrupted"].includes(state)
            ? null
            : ownerId,
          leaseExpiresAt: ["succeeded", "failed", "interrupted"].includes(state)
            ? null
            : input.leaseExpiresAt,
        })
        .where(
          and(
            eq(automationRuns.id, id),
            eq(automationRuns.ownerId, ownerId),
            or(
              eq(automationRuns.state, "pending"),
              eq(automationRuns.state, "running"),
            ),
          ),
        )
        .returning()
        .get() ?? null
    );
  };

  const reclaimExpiredRuns = (
    now: Date,
    newOwnerId: string,
    leaseExpiresAt: Date,
  ): AutomationRunRecord[] =>
    db
      .update(automationRuns)
      .set({
        state: "pending",
        phase: null,
        ownerId: newOwnerId,
        leaseExpiresAt,
        reason: "Previous execution lease expired",
      })
      .where(
        and(
          or(
            eq(automationRuns.state, "pending"),
            eq(automationRuns.state, "running"),
          ),
          lt(automationRuns.leaseExpiresAt, now),
        ),
      )
      .returning()
      .all();

  const renewLease = (
    id: string,
    ownerId: string,
    leaseExpiresAt: Date,
  ): boolean =>
    db
      .update(automationRuns)
      .set({ leaseExpiresAt })
      .where(
        and(
          eq(automationRuns.id, id),
          eq(automationRuns.ownerId, ownerId),
          or(
            eq(automationRuns.state, "pending"),
            eq(automationRuns.state, "running"),
          ),
        ),
      )
      .run().changes > 0;

  return {
    create,
    findById,
    list,
    update,
    delete: remove,
    listRuns,
    findRunById,
    claimRun,
    transitionRun,
    reclaimExpiredRuns,
    renewLease,
  };
}

export type AutomationsRepository = ReturnType<
  typeof createAutomationsRepository
>;
