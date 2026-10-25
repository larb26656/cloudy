---
title: Execute Automation Runs
slug: execute-automation-runs
id: 20261025-execute-automation-runs
status: ready
created: 2026-10-25
source: planning session 2026-10-25
---

# Plan: Execute Automation Runs

## Why

Persisted Automations need one server-owned way to start, observe, stop, and inspect isolated agent Runs regardless of which trigger fired. Expose CRUD and Run APIs, execute through the existing provider/session abstraction, and treat the final answer as the built-in Log destination while keeping the session available for read-only inspection.

## Target file

| Path                                                                       | Action                                                     |
| -------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `packages/server/src/features/automations/automations.model.ts`            | create — Zod input/output schemas                          |
| `packages/server/src/features/automations/automations.service.ts`          | create — definition validation and Run orchestration       |
| `packages/server/src/features/automations/automations.controller.ts`       | create — typed HTTP API                                    |
| `packages/server/src/features/automations/index.ts`                        | create — feature exports                                   |
| `packages/server/src/features/automations/automations.service.test.ts`     | create — service behavior and lifecycle tests              |
| `packages/server/src/features/automations/automations.integration.test.ts` | create — routes and read-only session contract tests       |
| `packages/ai-core/src/session.ts`                                          | edit — typed origin on normalized session                  |
| `packages/server/src/features/sessions/sessions.model.ts`                  | edit — session origin contract                             |
| `packages/server/src/features/sessions/sessions.service.ts`                | edit — persist origin, expose it, and guard user mutations |
| `packages/server/src/server.ts`                                            | edit — route registration                                  |
| `packages/server/src/container.ts`                                         | edit — dependency injection                                |

## Context the new session needs

- Depends on `docs/plan/20261025-persist-automation-definitions-and-runs.md`. Implement this before `docs/plan/20261025-schedule-automation-triggers.md` and `docs/plan/20261025-build-automation-ui.md`.
- `packages/server/src/features/sessions/sessions.service.ts:51-84,235-284` creates Cloudy-owned canonical sessions, sends messages, and aborts via the provider registry. `packages/server/src/providers/provider.registry.ts:135-200` offers normalized `createSession`, `sendMessage`, `abortSession`, `getSessionStatuses`, `listMessages`, and `subscribeEvents`; methods may be unsupported on some provider instances. `packages/ai-core/src/provider.ts:16-28,98-130` defines capabilities and operations; `packages/ai-core/src/interaction.ts:79-83` shows `sendMessage` returns an interaction response, not necessarily the completed assistant answer. Wait for definitive completion/failure and fetch the final answer before marking delivery successful.
- `packages/server/src/features/sessions/sessions.model.ts:13-21` and `packages/server/src/db/schema/sessions.ts:11-46` show session creation and persisted metadata. Store structured origin `{ type: "automation_run", runId }` on each created session and return it as a typed field on the normalized `ChatSession` (`packages/ai-core/src/session.ts:26-46`); existing sessions default to user origin. Do not conflate provider `ChatSession.runStatus` (`packages/ai-core/src/session.ts:4-10`) with Automation Run state. Keep automated sessions read-only at the HTTP boundary as well as in the later UI: deny user send, command, fork, update, delete, and interactive responses for these sessions; internal Run orchestration must still be able to send its initial prompt and abort via its own service path. Stop through the Run API, not the normal chat abort route.
- `packages/server/src/container.ts:40-139` wires repositories/services, and `packages/server/src/server.ts:25-137` mounts controllers and exports the Hono `AppType`; `packages/server/AGENTS.md:22-27,55-67` defines DI, error handling, and Zod-first contracts. Provider options must come from the registered instance/catalog (`provider.registry.ts:98-134`), rather than hard-coded `codex/cloudy/opencode` strings.
- Runtime shape: Trigger (manual now, scheduled later) creates a Run (`pending`); claim or `skipped` with reason `overlap`; create a fresh session; phase `working` while provider runs; phase `send_to_log` when storing final output; then `succeeded`. Provider/start/delivery errors produce `failed`; deliberate stop or expired ownership produces `interrupted` with a reason. No queue and no reuse of session or context across Runs. Temp directory is new per Run; specified directory may share files but never conversation context. Keep temporary files available while its session is inspectable (do not delete immediately after delivery); decide eventual retention policy in a separate feature. Only mark `interrupted` after confirmed stop or lease-expiry recovery; if provider abort is unsupported/fails, surface that error and retain the current Run state.
- Expose CRUD for Automations (including optional enable/disable schedule), list/get Runs, `POST /api/automations/:id/runs` (manual), and `POST /api/automations/:id/runs/:runId/stop`. The scheduler should call the same service start path with source `schedule` and a scheduled-slot key; never expose arbitrary trigger source from the client. A duplicate manual attempt while running should result in a visible skipped Run too.

## Tasks

- [ ] 1. Define validated Automation configuration, schedule, Run, and API response schemas (including five-field cron, IANA timezone, provider capabilities, and directory rules).
  - verify: `pnpm --filter @repo/server check-types` passes; invalid cron/timezone, missing specified directory, and unsupported provider operations are rejected rather than saved or left pending.
  - files: `packages/server/src/features/automations/automations.model.ts`
- [ ] 2. Implement Run orchestration through repository claims and provider-backed sessions with fresh context, completion detection, final answer delivery to Log, stop, ownership renewal, and terminal-state recovery.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/automations/automations.service.test.ts` covers manual success/failure, overlap skipped, stop interrupted, stale-lease recovery, and Log delivery failure.
  - files: `packages/server/src/features/automations/automations.service.ts`, `packages/server/src/features/automations/automations.service.test.ts`
- [ ] 3. Record session origin and enforce read-only behavior for user-facing session mutations while allowing the Automation service to drive and stop its own provider session.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/sessions/sessions.service.test.ts` passes, including blocked user message/fork/edit/delete and normal user chat remaining writable.
  - files: `packages/ai-core/src/session.ts`, `packages/server/src/features/sessions/sessions.model.ts`, `packages/server/src/features/sessions/sessions.service.ts`
- [ ] 4. Mount typed Automation/Run routes and wire services into the container.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/automations/automations.integration.test.ts` covers create/list/edit/disable, Run now, Run history, Stop, and forbidden session mutation.
  - files: `packages/server/src/features/automations/automations.controller.ts`, `packages/server/src/features/automations/index.ts`, `packages/server/src/features/automations/automations.integration.test.ts`, `packages/server/src/server.ts`, `packages/server/src/container.ts`

## Done when

- [ ] Manual Run produces a new inspectable, read-only provider session and stores final output/error under its own Run record.
- [ ] Run transitions `pending → running → succeeded|failed|interrupted`, or `pending → skipped` on overlap, with source, phase, reason, and timestamps; failed providers and permission/question waits terminate observably rather than hanging indefinitely.
- [ ] Editing an Automation does not change the config recorded for past Runs; provider and model mismatches cause a recorded failure instead of silently choosing another model.
- [ ] `pnpm --filter @repo/server test && pnpm --filter @repo/server lint && pnpm --filter @repo/server check-types` passes.

## Notes for implementer

- This cross-cutting slice needs routes, DI, session guards, and tests; keep each task scoped, and update this plan's checkboxes as implementation proceeds.
- Decide how provider events/statuses signal completion per adapter before relying on `sendMessage` returning; ensure stop and completion races produce one terminal state.
- Do not expose provider internals to the browser. Existing provider sessions and interactive chats must remain writable.
