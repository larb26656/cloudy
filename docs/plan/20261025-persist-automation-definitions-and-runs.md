---
title: Persist Automation Definitions and Runs
slug: persist-automation-definitions-and-runs
id: 20261025-persist-automation-definitions-and-runs
status: ready
created: 2026-10-25
source: planning session 2026-10-25
---

# Plan: Persist Automation Definitions and Runs

## Why

Cloudy has provider sessions but no durable definition of an automated job or history of individual attempts to run it. Persist Automations and Runs in the server instance's SQLite database so manual and scheduled triggers share a definition, execution history survives restarts, and competing server processes cannot start the same automation concurrently.

## Target file

| Path                                                                                  | Action                                                       |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `packages/server/src/db/schema/automations.ts`                                        | create — automation definition, including optional schedule  |
| `packages/server/src/db/schema/automation-runs.ts`                                    | create — run lifecycle, output, and active-run uniqueness    |
| `packages/server/src/db/schema/index.ts`                                              | edit — export new tables                                     |
| `packages/server/src/features/automations/automations.repository.ts`                  | create — definition and run persistence/atomic claims        |
| `packages/server/src/features/automations/automations.repository.integration.test.ts` | create — persistence and multi-process contention cases      |
| `packages/server/drizzle/`                                                            | create — generated migration and metadata from `db:generate` |

## Context the new session needs

- Implement this before `docs/plan/20261025-execute-automation-runs.md`. This plan deliberately covers storage only; runtime, scheduler, and UI have separate plans.
- `packages/server/src/db/schema/sessions.ts:11-46` illustrates Drizzle SQLite timestamps and typed records; `packages/server/src/db/schema/index.ts:1-5` exports the schema. `packages/server/src/db/client.ts:19-24` enables WAL and foreign keys; `packages/server/AGENTS.md:46-53` requires generating and shipping a Drizzle SQL migration.
- `packages/server/src/features/sessions/sessions.repository.ts` is the local repository convention; `packages/server/src/db/test-utils.ts` provides in-memory SQLite for integration tests. Repositories do persistence, not provider calls.
- `apps/desktop/AGENTS.md:61-63` says production Desktop and CLI deliberately share the default config directory/database. “Instance” means a data/config identity, not one OS process; concurrent claims must be safe across processes, not only guarded by an in-memory Set.
- `packages/ai-core/src/session.ts:4-10` already has a provider-level `RunStatus` on `ChatSession`. Automation Run is a separate persisted domain; do not reuse or rename that provider status.
- Domain contract: Automation holds name, prompt, provider instance ID, optional agent ID, optional model reference (`providerId` + `modelId`), directory mode (`temp` or `specified`), specified path when selected, optional enabled schedule (`cron` + IANA timezone), and timestamps. Manual is always an available trigger, not a second automation. One Run belongs to one Automation, stores trigger (`manual`/`schedule`), optional scheduled slot, `pending|running|succeeded|failed|skipped|interrupted`, optional phase (`working`/`send_to_log`), session ID, final output or error, reason, timestamps, and ownership/lease metadata for recovery. Persist enough of the selected config on the Run to make historical records intelligible after editing the Automation.
- `skipped` records overlap attempts; missed slots while the server is offline create no Run. `interrupted` covers deliberate stop and lost execution, differentiated by reason. The Run is not the session; one attempt creates a fresh session. Output is the final agent response delivered to the built-in Log destination; the session retains the detailed transcript.
- PoC flow: Manual or Schedule trigger → Run → `working` (provider session is inspectable) → `send_to_log` (store final answer) → terminal state. Webhook triggers, other destinations, and multi-step pipelines are future extensions, not PoC requirements.

## Tasks

- [x] 1. Add Automation and Run tables with lifecycle fields, relations, and indexes; generate the SQL migration.
  - verify: `pnpm --filter @repo/server db:generate && pnpm --filter @repo/server check-types` succeeds and the generated SQL contains both tables.
  - files: `packages/server/src/db/schema/automations.ts`, `packages/server/src/db/schema/automation-runs.ts`, `packages/server/src/db/schema/index.ts`, `packages/server/drizzle/`
- [x] 2. Implement repository operations for definition CRUD, run history, atomic active-run claim, terminal transitions, and expiry-based recovery ownership.
  - verify: `pnpm --filter @repo/server check-types` succeeds; a concurrent claim for the same automation admits only one active Run and persists a skipped attempt for the loser.
  - files: `packages/server/src/features/automations/automations.repository.ts`
- [x] 3. Cover persistence across repository re-creation and simultaneous claims against one SQLite file, including unique scheduled slots and expired versus live ownership.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/automations/automations.repository.integration.test.ts` passes.
  - files: `packages/server/src/features/automations/automations.repository.integration.test.ts`

## Done when

- [x] `pnpm --filter @repo/server db:generate` has produced a committed-ready SQL migration for Automation and Run storage.
- [x] Two repository instances using one SQLite file cannot create two active Runs for the same Automation or duplicate the same scheduled slot.
- [x] Run history survives repository re-creation and records trigger, state, session reference, final output/error, reason, and timestamps.
- [x] `pnpm --filter @repo/server lint && pnpm --filter @repo/server check-types && pnpm --filter @repo/server exec vitest run src/features/automations/automations.repository.integration.test.ts` passes.

## Notes for implementer

- Keep the atomic claim and skipped-result recording transactional; a process-local mutex cannot protect Desktop and CLI using the same database.
- Do not mark all existing `running` rows interrupted merely because another process started: only reclaim expired ownership. Coordinate lease expiry/renewal with the execution plan.
- This feature spans schema, migration, and repository files by necessity; keep each task limited to its stated storage responsibility. Update this plan's checkboxes as tasks are completed.
