import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb } from "../../db";
import { createAutomationsRepository } from "./automations.repository";

describe("automations repository", () => {
  const directory = mkdtempSync(join(tmpdir(), "cloudy-automations-"));
  const path = join(directory, "test.sqlite");
  const firstDb = createDb(path);
  migrate(firstDb.db, {
    migrationsFolder: join(import.meta.dirname, "../../../drizzle"),
  });
  const secondDb = createDb(path);
  const first = createAutomationsRepository(firstDb.db);
  const second = createAutomationsRepository(secondDb.db);

  beforeAll(() => {
    first.create({
      id: "automation-1",
      name: "Daily",
      prompt: "Do work",
      providerInstanceId: "provider-1",
      directoryMode: "temp",
    });
  });
  afterAll(() => {
    firstDb.close();
    secondDb.close();
    rmSync(directory, { recursive: true, force: true });
  });

  const claim = (
    repo: typeof first,
    id: string,
    trigger: "manual" | "schedule" = "manual",
    scheduledFor?: Date,
  ) =>
    repo.claimRun({
      id,
      automationId: "automation-1",
      trigger,
      scheduledFor,
      configSnapshot: { prompt: "Do work" },
      ownerId: id,
      leaseExpiresAt: new Date(Date.now() + 60_000),
    });

  it("persists definitions and run history across repository re-creation", () => {
    const result = claim(first, "run-history");
    first.transitionRun(result.run.id, "run-history", "running", {
      sessionId: "session-1",
      phase: "working",
    });
    first.transitionRun(result.run.id, "run-history", "succeeded", {
      output: "Done",
    });
    const recreated = createAutomationsRepository(secondDb.db);
    expect(recreated.findById("automation-1")?.name).toBe("Daily");
    expect(recreated.listRuns("automation-1")[0]).toMatchObject({
      id: "run-history",
      trigger: "manual",
      state: "succeeded",
      sessionId: "session-1",
      output: "Done",
    });
    expect(recreated.findRunById("automation-1", "run-history")).toMatchObject({
      id: "run-history",
      state: "succeeded",
    });
    expect(recreated.findRunById("other-automation", "run-history")).toBeNull();
    expect(recreated.findRunById("automation-1", "missing-run")).toBeNull();
  });

  it("atomically admits one active run and records an overlapping attempt as skipped", () => {
    const winner = claim(first, "winner");
    const loser = claim(second, "loser");
    expect(winner.claimed).toBe(true);
    expect(loser.claimed).toBe(false);
    expect(loser.run.state).toBe("skipped");
    first.transitionRun(winner.run.id, "winner", "succeeded");
  });

  it("does not duplicate scheduled slots and distinguishes live from expired owners", () => {
    const slot = new Date("2026-10-25T10:00:00.000Z");
    const scheduled = claim(first, "scheduled", "schedule", slot);
    expect(claim(second, "scheduled-duplicate", "schedule", slot).run.id).toBe(
      scheduled.run.id,
    );
    first.transitionRun(scheduled.run.id, "scheduled", "succeeded");
    const repo = createAutomationsRepository(firstDb.db);
    const live = claim(repo, "live-owner");
    expect(claim(second, "blocked-by-live").run.state).toBe("skipped");
    repo.transitionRun(live.run.id, "live-owner", "running", {
      leaseExpiresAt: new Date(Date.now() - 1000),
    });
    const recovered = claim(second, "new-owner");
    expect(recovered.claimed).toBe(true);
    expect(repo.findById("automation-1")).not.toBeNull();
  });
});
