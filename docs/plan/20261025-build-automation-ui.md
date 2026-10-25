---
title: Build Automation UI
slug: build-automation-ui
id: 20261025-build-automation-ui
status: ready
created: 2026-10-25
source: planning session 2026-10-25
---

# Plan: Build Automation UI

## Why

The Automation API needs an interface for configuring a repeatable prompt, choosing a provider/agent/model and directory, scheduling or running it now, and viewing results. Build an Automation surface showing Run history, the final Log output, and a read-only link into the provider session for detailed work-in-progress.

## Target file

| Path                                                                       | Action                                                                            |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `apps/web-app/src/features/automations/`                                   | create — Automation list/editor, Run history/details, and focused component tests |
| `apps/web-app/src/hooks/queries/`                                          | create — Automation/Run RPC hooks                                                 |
| `apps/web-app/src/lib/cloudy/query-keys.ts`                                | edit — Automation/Run query keys                                                  |
| `apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx` | edit — view automation-owned sessions without chat controls                       |
| `apps/web-app/src/components/chat/ChatContainer.tsx`                       | edit — render session transcript read-only when origin is `automation_run`        |
| `apps/web-app/src/features/home/tabs/implementations/chat/meta.tsx`        | edit — suppress session rename for automation-owned sessions                      |
| `apps/web-app/src/features/app/`                                           | edit — add discoverable Automation entry to existing navigation                   |

## Context the new session needs

- Depends on `docs/plan/20261025-execute-automation-runs.md` and `docs/plan/20261025-schedule-automation-triggers.md`; API shapes should be inferred through `cloudyClient` (`apps/web-app/AGENTS.md:197-240`) rather than hand-written DTOs. `apps/web-app/src/lib/cloudy/query-keys.ts` owns server-state query keys; use TanStack Query for Automations and Runs, not persisted Zustand state.
- `apps/web-app/src/components/chat/ChatContainer.tsx:54-68,160-205` wraps provider-specific message rendering and includes input, status controls, session picker, permission/question interactions; `apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx:24-51` loads an existing session. `apps/web-app/src/features/home/tabs/implementations/chat/meta.tsx:26-63` supports title editing. For origin `automation_run`, reuse message rendering/live updates but do not expose user text input, model/agent selection, rename, fork, commands, or interaction responses; provide a link back to its Run. Backend session mutations must already be forbidden in the execution plan. Ordinary user chats stay unchanged.
- Provider/agent/model are two levels: first pick a Cloudy agent-provider **instance** (e.g. Codex/Cloudy/OpenCode), then an agent within it and a model supported by its catalog. `packages/ai-core/src/provider.ts:16-28` has `requiresDirectory`, `agents`, and `models` capabilities. Show temp/specified directory only as supported/needed. A temporary directory is fresh for each Run; specified path shares files, but every Run still uses a fresh session.
- Automation editor: name, prompt, provider instance, agent, model, directory policy, optional enabled schedule. Cron is five-field with a few presets (e.g. daily 09:00, weekdays 09:00, weekly, hourly), editable expression, fixed selected timezone, validation and next three occurrence previews. Manual `Run now` is available regardless of schedule. Run details show trigger source, status, current phase (`working`/`send_to_log`), reason/error, timestamps, and final Log output; open the session to inspect transcript and ongoing work. Stop is available while pending/running; overlap displays `skipped` with reason.
- `apps/web-app/AGENTS.md:16-20` requires reading `apps/web-app/DESIGN.md` before UI work; `apps/web-app/AGENTS.md:293-305` requires shared Loading/Error/Empty state components; `apps/web-app/AGENTS.md:589-605` explains frontend test projects. If a new tab type is appropriate, follow the tab registry guide at `apps/web-app/AGENTS.md:91-159` and its local skill; do not invent a second tab system. Choose navigation consistent with the actual app chrome when implementing.

## Tasks

- [x] 1. Add typed RPC query/mutation hooks and keys for Automation CRUD, cron previews, Run now/stop, and Run detail/history.
  - verify: `pnpm --filter web-app check-types` passes and hooks invalidate Automation/Run queries after each mutation.
  - files: `apps/web-app/src/hooks/queries/`, `apps/web-app/src/lib/cloudy/query-keys.ts`
- [x] 2. Build Automation list/editor with provider catalog selection, prompt, directory configuration, optional cron presets/expression/timezone, next-three preview, and Run now.
  - verify: `pnpm --filter web-app exec vitest run src/features/automations` covers required fields, capability-dependent controls, cron error/preview, and manual trigger.
  - files: `apps/web-app/src/features/automations/`, `apps/web-app/src/features/app/`
- [x] 3. Build Run history/detail with states, Log output, Stop action, and a link to the associated session.
  - verify: focused component tests distinguish manual/schedule, show skipped/failed/interrupted reasons, and open the matching session ID.
  - files: `apps/web-app/src/features/automations/`
- [x] 4. Make automation-owned session viewing read-only using the persisted session origin, while preserving normal interactive chats.
  - verify: `pnpm --filter web-app exec vitest run src/components/chat src/features/home/tabs/implementations/chat` passes, including no input/edit/action controls for `automation_run` and ordinary user chat still accepting input.
  - files: `apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx`, `apps/web-app/src/components/chat/ChatContainer.tsx`, `apps/web-app/src/features/home/tabs/implementations/chat/meta.tsx`

## Done when

- [x] A user can create/edit an Automation, choose a valid provider/agent/model and directory, enable cron in a fixed timezone, preview its next three occurrences, and run it manually.
- [x] The Automation's Runs list shows status/source/reason and Log output, and each working/completed Run opens its own read-only session for details.
- [x] Normal chat sessions remain interactive; automation sessions cannot be edited or sent additional messages from the UI.
- [ ] `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run` passes.

## Verification results

- `pnpm --filter web-app check-types` — passed.
- `pnpm --filter web-app lint` — passed with 7 existing warnings outside the automation changes.
- `pnpm --filter web-app exec vitest run src/features/automations src/components/chat src/features/home/tabs/implementations/chat` — passed (250 tests).
- `pnpm --filter web-app design:lint` — passed with 23 existing design-token/contrast warnings and no errors.
- `pnpm --filter web-app exec vitest run` — blocked by 3 Storybook interaction failures in `src/features/chat/components/CreateChatDialog.stories.tsx` (`Choose Workspace`, `Session Picker`, `Session Empty`); 908 other tests passed. Therefore the final Done when checkbox remains unchecked.

## Notes for implementer

- This UI slice spans data hooks, navigation, Automation pages, and the existing chat viewer. Keep substeps incremental and update this plan's checkboxes after verification.
- Avoid duplicating full provider transcripts in Automation Log: the Log is the final result and run-level errors, and the session viewer provides detailed work history.
