---
title: Schedule Automation Triggers
slug: schedule-automation-triggers
id: 20261025-schedule-automation-triggers
status: ready
created: 2026-10-25
source: planning session 2026-10-25
---

# Plan: Schedule Automation Triggers

## Why

Manual Runs alone do not start work at a configured time. Add a server-owned cron trigger that uses each Automation's saved timezone, fires only while that server data instance is online, and invokes exactly the same Run path as manual triggering without backfilling offline slots or duplicating work across processes.

## Target file

| Path                                                                     | Action                                                                                   |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `packages/server/src/features/automations/automations.scheduler.ts`      | create — cron timing, slot claims, scheduler lifecycle                                   |
| `packages/server/src/features/automations/automations.scheduler.test.ts` | create — clock, DST, overlap, restart and multi-process tests                            |
| `packages/server/src/features/automations/automations.model.ts`          | edit — reusable cron validation/next-fire calculation if not completed in execution plan |
| `packages/server/src/features/automations/automations.controller.ts`     | edit — next-three-occurrences preview endpoint                                           |
| `packages/server/src/container.ts`                                       | edit — construct scheduler from Automation service/repository                            |
| `packages/server/src/server/createServer.ts`                             | edit — start and stop scheduler with server                                              |

## Context the new session needs

- Depends on `docs/plan/20261025-persist-automation-definitions-and-runs.md` and `docs/plan/20261025-execute-automation-runs.md`. The scheduler calls their shared Run start method with source `schedule` and scheduled slot; it must not make its own provider session API.
- `packages/server/src/server/createServer.ts:15-19,53-65` starts the container/event hub and tears them down; `packages/server/src/container.ts:40-139` constructs instance-scoped dependencies. Do not start a scheduler in `createApp()` or on module import: frontend requests must not spawn timers. Desktop embeds this same server (`apps/desktop/AGENTS.md:8-11`), and production Desktop and CLI may share a DB (`apps/desktop/AGENTS.md:61-63`). On graceful stop, stop timers then request abort of Runs owned by this process and mark them `interrupted` once confirmed; do not interrupt Runs owned by another live process.
- Schedule is an optional trigger on an Automation, not the top-level resource. Store five-field cron + selected IANA timezone; the execution plan validates both on create/edit. Support a few presets in the UI plan by writing ordinary cron expressions. Expose next three future run times from the same evaluator through the Automation API for UI preview. Keep timezone fixed to the selected value even if the machine timezone changes.
- No catch-up: on server startup/restart calculate next occurrences strictly after startup instead of replaying all missed slots. Missed offline times create no Run. While online, attempted overlap creates a `skipped` Run with reason `overlap` through the shared start path. A repeated wall-clock minute during DST must not run the same scheduled slot twice; nonexistent local times do not fire. Scheduled slot uniqueness and atomic active-run claim belong in the persistence plan.
- Treat invalid/missing provider selection at fire time as a failed Run, not a silent skip. Deleting/disabling/editing a schedule must invalidate pending timers. `packages/server/AGENTS.md:22-27` defines DI and server bootstrap.

## Tasks

- [x] 1. Implement five-field cron and timezone next-fire evaluation with explicit DST behavior and expose its next-three-occurrences preview.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/automations/automations.scheduler.test.ts` passes cases for daily 09:00 in `Asia/Bangkok`, weekday presets, invalid expressions, and DST gaps/duplicates.
  - files: `packages/server/src/features/automations/automations.scheduler.ts`, `packages/server/src/features/automations/automations.scheduler.test.ts`, `packages/server/src/features/automations/automations.model.ts`, `packages/server/src/features/automations/automations.controller.ts`
- [x] 2. Start/stop schedule evaluation with the server and atomically claim each due slot through the shared Run service.
  - verify: scheduler tests prove manual and scheduled triggers share Run behavior, graceful stop cancels timers and stops only owned Runs, restart skips missed slots, overlap records skipped, and two processes on one DB create at most one Run per slot.
  - files: `packages/server/src/features/automations/automations.scheduler.ts`, `packages/server/src/features/automations/automations.scheduler.test.ts`, `packages/server/src/container.ts`, `packages/server/src/server/createServer.ts`

## Done when

- [x] A server with an enabled cron expression fires at the selected timezone and creates a normal `schedule` Run through the shared Run service, preserving the inspectable session and final Log result behavior.
- [x] Restarting after a missed time creates no retroactive Run, and disabling/editing a schedule changes future occurrences.
- [x] Overlap is visible as `skipped`; concurrent processes using the same DB never duplicate a scheduled slot.
- [x] `pnpm --filter @repo/server exec vitest run src/features/automations && pnpm --filter @repo/server lint && pnpm --filter @repo/server check-types` passes.

## Notes for implementer

- Choose a cron library with explicit IANA timezone support; use a clock injectable into tests instead of sleeping until real times.
- If adding a dependency, keep package manifest/lockfile in sync; only start timers after the server has successfully started and stop them on shutdown. Update this plan's checkboxes as implementation proceeds.
