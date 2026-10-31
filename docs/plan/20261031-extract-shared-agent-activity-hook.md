---
title: Extract shared agent activity hook
slug: extract-shared-agent-activity-hook
id: 20261031-extract-shared-agent-activity-hook
status: ready
created: 2026-10-31
source: planning session 2026-10-31
---

# Plan: Extract shared agent activity hook

## Why

Cloudy currently derives active and waiting session state inside `usePetActivity`, which couples reusable agent activity data to the Pet feature and its sprite state type. Extract the session/activity derivation into a neutral hook so the Pet and the notification-area Cloudy control can share it.

## Target file

| Path                                                         | Action                                                                       |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `apps/web-app/src/hooks/useAgentActivity.ts`                 | create                                                                       |
| `apps/web-app/src/hooks/useAgentActivity.component.test.tsx` | create                                                                       |
| `apps/web-app/src/hooks/usePetActivity.ts`                   | edit (temporary compatibility re-export/wrapper until Pet consumers migrate) |

## Context the new session needs

- Read `apps/web-app/AGENTS.md`, especially the React Query and state-management conventions. Server state belongs in TanStack Query, not Zustand.
- Existing implementation is `apps/web-app/src/hooks/usePetActivity.ts:23-177`. It loads up to 8 recent sessions, filters sessions by active/running state and provider capabilities, polls pending questions and permissions, derives ordered activity records/counts, and returns workspace data.
- Query polling uses `CHAT_POLL_INTERVAL` (15 seconds) and `refetchIntervalInBackground: false`; preserve that behavior for questions and permissions. The current recent-session hook itself has no explicit polling interval.
- The new hook must not import `PetState`, `PetSprite`, or expose pet-specific labels. Keep activity concepts provider-neutral: records for `working` / `wait-for-human`, reason (`question` / `permission`), overall activity state (`idle` / `working` / `wait-for-human`), counts, loading/error, and workspaces.
- Keep the old `usePetActivity` API temporarily as a thin adapter/re-export so this extraction is independently type-safe. The follow-up Pet migration plan removes that adapter after consumers move.
- Backend session questions/permissions are already available through `cloudyClient.api.sessions[":sessionId"]`; no backend change is needed.

## Tasks

- [x] 1. **Extract recent-session filtering, pending-interaction polling, and activity derivation into `useAgentActivity` without importing Pet types.**
  - verify: `pnpm --filter web-app check-types`
  - files: `apps/web-app/src/hooks/useAgentActivity.ts`, `apps/web-app/src/hooks/usePetActivity.ts`
- [x] 2. **Move hook behavior tests to the generic hook and cover provider filtering, waiting priority, counts, and idle state.**
  - verify: `pnpm --filter web-app exec vitest run src/hooks/useAgentActivity.component.test.tsx`
  - files: `apps/web-app/src/hooks/useAgentActivity.component.test.tsx`
- [x] 3. **Run focused frontend checks to confirm the compatibility adapter keeps existing Pet consumers working.**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run src/hooks/useAgentActivity.component.test.tsx src/hooks/usePetActivity.component.test.tsx`
  - files: `apps/web-app/src/hooks/useAgentActivity.ts`, `apps/web-app/src/hooks/useAgentActivity.component.test.tsx`, `apps/web-app/src/hooks/usePetActivity.ts`

## Done when

- [x] Shared activity derivation is exported from `useAgentActivity` and has no Pet/Sprite dependency.
- [x] Existing Pet consumers continue to work through the temporary compatibility adapter.
- [x] Focused tests, lint, and typecheck pass.

## Notes for implementer

- Preserve `CHAT_POLL_INTERVAL` and background-poll pause semantics.
- Use selectors for Zustand stores if any are introduced in later consumers; this hook itself should remain server-state-only.
- Do not edit generated route files.
