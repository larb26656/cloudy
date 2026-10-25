---
title: Notification Action for Automations
slug: notification-automation-action
id: 20261025-notification-automation-action
status: ready
created: 2026-10-25
source: planning session 2026-10-25
---

# Plan: Notification Action for Automations

## Why

Cloudy Automations can run and persist their final result, but they cannot deliver that result to external destinations. Add a notification action that selects one or more saved notification profiles and dispatches the automation result through the shared provider service. Keep Automation configuration independent of Discord so other notification providers can be selected later without changing the action contract.

## Target file

| Path                                                                 | Action                                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `packages/server/src/db/schema/automations.ts`                       | edit — persist selected notification profile ids                       |
| `packages/server/src/db/schema/automation-runs.ts`                   | edit — snapshot notification destination selection for run history     |
| `packages/server/src/features/automations/automations.repository.ts` | edit — persist/read notification action config                         |
| `packages/server/src/features/automations/automations.model.ts`      | edit — validate notification action shape                              |
| `packages/server/src/features/automations/automations.service.ts`    | edit — dispatch run result                                             |
| `packages/server/src/features/automations/automations.controller.ts` | edit — expose updated automation DTO contract                          |
| `packages/server/src/container.ts`                                   | edit — inject notification dispatcher                                  |
| `packages/server/drizzle/`                                           | create — generated migration                                           |
| `apps/web-app/src/features/automations/`                             | edit — choose profiles in automation editor and show delivery outcomes |

## Context the new session needs

- Prerequisites: `docs/plan/20261025-notification-provider-dispatch-core.md` and `docs/plan/20261025-notification-provider-profiles-ui.md` must be implemented. Existing Automation foundation is described in `docs/plan/20261025-persist-automation-definitions-and-runs.md`, `docs/plan/20261025-execute-automation-runs.md`, and `docs/plan/20261025-build-automation-ui.md`.
- Current Automation fields are in `packages/server/src/features/automations/automations.model.ts:50-59`; database schemas are `packages/server/src/db/schema/automations.ts` and `automation-runs.ts`. The service factory in `packages/server/src/features/automations/automations.service.ts:31-35` currently injects repository, provider registry, sessions, and workspaces; inject the notification dispatcher through the existing manual DI pattern.
- Define the action as an optional list of profile ids on the Automation (empty/omitted means no external notification). One profile remains one provider destination; selecting multiple profiles fans out independently through the dispatcher. Validate selected profile ids when creating/updating an Automation and again before dispatch so deleted profiles are reported rather than silently ignored.
- Dispatch the final automation output only after its existing successful run completion/Log persistence path. Preserve the Run's config snapshot so history reflects which profile ids were selected at execution time. Notification failure must not convert an otherwise successful Automation Run to failed; delivery results are separately persisted in the notification delivery log and exposed as a non-fatal outcome.
- Keep notification provider id/config out of Automation schemas: Automations store only profile ids and call the provider-agnostic dispatcher. Existing direct dispatcher support remains available to other features.
- Frontend server state uses typed `cloudyClient` RPC hooks and TanStack Query. `apps/web-app/src/features/automations/` contains the existing Automation UI; read `apps/web-app/AGENTS.md` and `DESIGN.md` before changing it. Use profile query hooks from the profiles UI plan rather than duplicating API calls.

## Tasks

- [ ] 1. Extend Automation and Run persistence with optional selected profile ids and generate a migration.
  - verify: `pnpm --filter @repo/server db:generate && pnpm --filter @repo/server check-types` succeeds; integration tests show the Automation setting and Run snapshot survive repository recreation.
  - files: `packages/server/src/db/schema/automations.ts`, `packages/server/src/db/schema/automation-runs.ts`, `packages/server/src/features/automations/automations.repository.ts`, `packages/server/drizzle/`
- [ ] 2. Validate profile selections and dispatch successful Run output through the injected notification dispatcher.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/automations` covers no-profile success, multi-profile dispatch, deleted-profile validation, dispatch failure remaining non-fatal, and the Run config snapshot.
  - files: `packages/server/src/features/automations/automations.model.ts`, `packages/server/src/features/automations/automations.service.ts`, `packages/server/src/features/automations/automations.controller.ts`, `packages/server/src/container.ts`
- [ ] 3. Add profile selection to Automation create/edit UI and present notification delivery outcomes without treating them as Run failures.
  - verify: `pnpm --filter web-app exec vitest run src/features/automations` covers selecting/clearing multiple profiles and rendering successful/failed delivery outcomes; `pnpm --filter web-app check-types` passes.
  - files: `apps/web-app/src/features/automations/`
- [ ] 4. Run backend and frontend quality gates.
  - verify: `pnpm --filter @repo/server test && pnpm --filter @repo/server lint && pnpm --filter @repo/server check-types && pnpm --filter web-app lint && pnpm --filter web-app check-types` passes.
  - files: —

## Done when

- [ ] An Automation can be configured with zero or more notification profiles and the selected ids are snapshotted on each Run.
- [ ] A successful Run dispatches its final output once through the provider-agnostic dispatcher to each selected profile.
- [ ] Notification delivery failures are visible in delivery outcomes/logs and do not change the Automation Run's success state.
- [ ] The Automation UI can choose and clear profiles and display delivery outcomes.
- [ ] Backend and frontend quality gates pass.

## Notes for implementer

- Preserve the existing Automation lifecycle and built-in Log behavior; external notification delivery is an additional action.
- Do not store provider credentials or provider-specific payload fields in Automation records or Run snapshots.
- Update this plan's checkboxes as tasks are completed.
