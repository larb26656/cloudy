import { afterEach, describe, expect, it, vi } from "vitest";
import { createAutomationsScheduler } from "./automations.scheduler";
import {
  canonicalCronSlot,
  cronMatches,
  nextCronOccurrences,
} from "./automations.scheduler";
import { cronExpressionSchema } from "./automations.model";

describe("automation schedule evaluation", () => {
  afterEach(() => vi.useRealTimers());
  it("finds daily occurrences in the configured timezone", () => {
    const occurrences = nextCronOccurrences(
      "0 9 * * *",
      "Asia/Bangkok",
      new Date("2026-10-25T00:00:00.000Z"),
      1,
    );
    expect(occurrences[0]?.toISOString()).toBe("2026-10-25T02:00:00.000Z");
  });

  it("supports weekday ranges and rejects malformed/out-of-range fields", () => {
    expect(cronExpressionSchema.safeParse("0 9 * * 1-5").success).toBe(true);
    expect(cronExpressionSchema.safeParse("61 9 * * 1-5").success).toBe(false);
    expect(cronExpressionSchema.safeParse("0 9 * *").success).toBe(false);
    expect(
      cronMatches(
        "0 9 * * 1-5",
        new Date("2026-10-26T02:00:00Z"),
        "Asia/Bangkok",
      ),
    ).toBe(true);
    expect(
      cronMatches(
        "0 9 * * 1-5",
        new Date("2026-10-25T02:00:00Z"),
        "Asia/Bangkok",
      ),
    ).toBe(false);
  });

  it("matches lists, ranges, steps, and Sunday as either zero or seven", () => {
    const mondayNine = new Date("2026-10-26T09:00:00.000Z");
    const sundayNine = new Date("2026-10-25T09:00:00.000Z");

    expect(cronMatches("0,30 9-10 * * 1-5", mondayNine, "UTC")).toBe(true);
    expect(
      cronMatches("*/15 9 * * *", new Date("2026-10-26T09:45:00.000Z"), "UTC"),
    ).toBe(true);
    expect(
      cronMatches("*/15 9 * * *", new Date("2026-10-26T09:46:00.000Z"), "UTC"),
    ).toBe(false);
    expect(cronMatches("0 9 * * 7", sundayNine, "UTC")).toBe(true);
    expect(cronMatches("0 9 * * 0", sundayNine, "UTC")).toBe(true);
    expect(cronMatches("0 9 * * * extra", mondayNine, "UTC")).toBe(false);
  });

  it("uses cron day-of-month and weekday matching rules", () => {
    const monday = new Date("2026-10-26T09:00:00.000Z");
    const tuesday = new Date("2026-10-27T09:00:00.000Z");

    expect(cronMatches("0 9 26 * 2", monday, "UTC")).toBe(true);
    expect(cronMatches("0 9 26 * 1", tuesday, "UTC")).toBe(false);
    expect(cronMatches("0 9 27 * 2", tuesday, "UTC")).toBe(true);
    expect(cronMatches("0 9 26 * *", monday, "UTC")).toBe(true);
    expect(cronMatches("0 9 * * 1", monday, "UTC")).toBe(true);
  });

  it("skips nonexistent local times and deduplicates repeated DST minutes", () => {
    const gap = nextCronOccurrences(
      "30 2 * * *",
      "America/New_York",
      new Date("2026-03-08T05:00:00.000Z"),
      1,
    );
    expect(gap[0]?.toISOString()).toBe("2026-03-09T06:30:00.000Z");

    const duplicate = nextCronOccurrences(
      "30 1 * * *",
      "America/New_York",
      new Date("2026-11-01T04:00:00.000Z"),
      2,
    );
    expect(duplicate.map((date) => date.toISOString())).toEqual([
      "2026-11-01T05:30:00.000Z",
      "2026-11-02T06:30:00.000Z",
    ]);
  });

  it("canonicalizes repeated DST wall-clock slots to their first occurrence", () => {
    const first = new Date("2026-11-01T05:30:00.000Z");
    const repeated = new Date("2026-11-01T06:30:00.000Z");

    expect(canonicalCronSlot("30 1 * * *", "America/New_York", first)).toEqual(
      first,
    );
    expect(
      canonicalCronSlot("30 1 * * *", "America/New_York", repeated),
    ).toEqual(first);
  });

  it("returns no occurrences when count is zero and starts strictly after the given time", () => {
    const after = new Date("2026-10-25T02:00:00.000Z");

    expect(nextCronOccurrences("0 9 * * *", "Asia/Bangkok", after, 0)).toEqual(
      [],
    );
    expect(
      nextCronOccurrences(
        "0 9 * * *",
        "Asia/Bangkok",
        after,
        1,
      )[0]?.toISOString(),
    ).toBe("2026-10-26T02:00:00.000Z");
  });

  it("does not backfill startup slots, evaluates current schedules, and stops cleanly", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-25T01:59:00.000Z"));
    const start = vi.fn().mockResolvedValue(undefined);
    const stopOwnedRuns = vi.fn().mockResolvedValue(undefined);
    const service = {
      list: () => [
        {
          id: "automation-1",
          schedule: {
            cron: "0 9 * * *",
            timezone: "Asia/Bangkok",
            enabled: true,
          },
        },
      ],
      start,
      stopOwnedRuns,
    } as never;
    const scheduler = createAutomationsScheduler(service, {
      intervalMs: 1_000,
    });
    scheduler.start();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(start).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith(
      "automation-1",
      "schedule",
      new Date("2026-10-25T02:00:00.000Z"),
    );
    await scheduler.stop();
    expect(stopOwnedRuns).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("starts only enabled matching automations and makes start idempotent", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-25T01:59:00.000Z"));
    const start = vi.fn().mockResolvedValue(undefined);
    const list = vi.fn(() => [
      {
        id: "enabled",
        schedule: {
          cron: "0 9 * * *",
          timezone: "Asia/Bangkok",
          enabled: true,
        },
      },
      {
        id: "disabled",
        schedule: {
          cron: "0 9 * * *",
          timezone: "Asia/Bangkok",
          enabled: false,
        },
      },
      { id: "unscheduled", schedule: null },
      {
        id: "not-matching",
        schedule: {
          cron: "1 9 * * *",
          timezone: "Asia/Bangkok",
          enabled: true,
        },
      },
    ]);
    const service = {
      list,
      start,
      stopOwnedRuns: vi.fn().mockResolvedValue(undefined),
    } as never;
    const scheduler = createAutomationsScheduler(service, {
      intervalMs: 1_000,
    });

    scheduler.start();
    scheduler.start();
    await vi.advanceTimersByTimeAsync(61_000);

    expect(list).toHaveBeenCalledOnce();
    expect(start).toHaveBeenCalledExactlyOnceWith(
      "enabled",
      "schedule",
      new Date("2026-10-25T02:00:00.000Z"),
    );
    await scheduler.stop();
  });

  it("does not run a schedule in the same minute as startup and stops future ticks", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-25T02:00:00.000Z"));
    const start = vi.fn().mockResolvedValue(undefined);
    const list = vi.fn(() => [
      {
        id: "automation-1",
        schedule: {
          cron: "0 9 * * *",
          timezone: "Asia/Bangkok",
          enabled: true,
        },
      },
    ]);
    const service = {
      list,
      start,
      stopOwnedRuns: vi.fn().mockResolvedValue(undefined),
    } as never;
    const scheduler = createAutomationsScheduler(service, {
      intervalMs: 1_000,
    });

    scheduler.start();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(list).not.toHaveBeenCalled();

    await scheduler.stop();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(list).not.toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
  });

  it("uses the injected clock for preview and returns three future occurrences", () => {
    const now = new Date("2026-10-25T00:00:00.000Z");
    const scheduler = createAutomationsScheduler({} as never, {
      now: () => now,
    });

    expect(
      scheduler
        .preview("0 9 * * *", "Asia/Bangkok")
        .map((date) => date.toISOString()),
    ).toEqual([
      "2026-10-25T02:00:00.000Z",
      "2026-10-26T02:00:00.000Z",
      "2026-10-27T02:00:00.000Z",
    ]);
  });
});
