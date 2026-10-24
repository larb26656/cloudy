---
title: Migrate Session API to Hono RPC
slug: migrate-session-api-to-hono-rpc
id: 20261025-migrate-session-api-to-hono-rpc
status: implemented
created: 2026-10-25
source: planning session 2026-10-25
---

# Plan: Migrate Session API to Hono RPC

## Why

The web app's `sessionApi` in `src/lib/cloudy/provider.ts` manually assembles requests for Cloudy's normalized `/api/sessions` endpoints even though these routes are part of the Hono `AppType` exposed through `cloudyClient`. Migrating the session operations to RPC removes duplicated URL and request construction and makes params, payloads, and responses type-checked while preserving existing chat behavior.

## Target file

| Path                                               | Action                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `apps/web-app/src/lib/cloudy/provider.ts`          | edit — remove sessionApi fetch helpers after migration                                     |
| `apps/web-app/src/hooks/queries/useSessions.ts`    | edit — use typed session RPC operations                                                    |
| `apps/web-app/src/hooks/queries/useMessages.ts`    | edit — use typed message/abort RPC operations                                              |
| `apps/web-app/src/hooks/queries/usePermissions.ts` | edit — use typed permission RPC operations                                                 |
| `apps/web-app/src/hooks/queries/useQuestions.ts`   | edit — use typed question RPC operations                                                   |
| `apps/web-app/src/hooks/queries/useCommand.ts`     | edit — use typed session command RPC operation                                             |
| `apps/web-app/src/hooks/usePetActivity.ts`         | edit — use typed session question/permission RPC operations                                |
| `apps/web-app/src/**`                              | edit — update any remaining runtime `sessionApi` consumers discovered by repository search |

## Context the new session needs

- `apps/web-app/src/lib/api.ts:1-18` provides the cached `cloudyClient` typed as `hc<AppType>`, including credentials and auth headers. Use it for ordinary HTTP requests and preserve type-only import rules for `@repo/contracts`.
- `apps/web-app/src/lib/cloudy/provider.ts:20-33, 105-146` defines `sessionRequest` and `sessionApi`, manually building `/api/sessions` paths and JSON bodies. Runtime consumers include `useSessions.ts`, `useMessages.ts`, `usePermissions.ts`, `useQuestions.ts`, `useCommand.ts`, and `usePetActivity.ts`; tests may mock this module too.
- Routes are mounted at `packages/server/src/server.ts:86`; inspect `packages/server/src/features/sessions/sessions.controller.ts` for exact RPC paths and request schema. Those endpoints represent Cloudy-owned normalized session data and are appropriate for typed RPC.
- Existing migrations `docs/plan/20260927-migrate-frontend-chat-to-provider-api.md` and `docs/plan/20260927-migrate-frontend-model-catalog-to-provider-api.md` established the provider-neutral API boundary. Preserve normalized `@repo/ai-core` data and do not reintroduce provider SDK types in the browser.
- Keep the existing query keys, pagination behavior, mutations/invalidation, and empty response handling. Do not change UI-facing result shapes unless required by the actual route types.
- `GlobalEventProvider` SSE, PTY WebSocket, and notifications WebSocket use streaming protocols and are explicitly outside this ordinary request migration.

## Tasks

- [x] 1. Inventory runtime `sessionApi` consumers and map every operation to the exact typed Hono route, parameter, and body shape.
  - verify: `rg -n 'sessionApi' apps/web-app/src --glob '!**/*.stories.*'` enumerates consumers and each maps to an existing `/api/sessions` route
  - files: `apps/web-app/src/lib/cloudy/provider.ts`, `apps/web-app/src/hooks/queries/useSessions.ts`, `apps/web-app/src/hooks/queries/useMessages.ts`, `apps/web-app/src/hooks/queries/usePermissions.ts`, `apps/web-app/src/hooks/queries/useQuestions.ts`, `apps/web-app/src/hooks/queries/useCommand.ts`, `apps/web-app/src/hooks/usePetActivity.ts`
- [x] 2. Migrate session, messages, permissions, questions, commands, and pet activity requests to `cloudyClient`, preserving query and mutation behavior.
  - verify: `pnpm --filter web-app exec vitest run src/hooks/queries src/hooks/usePetActivity`
  - files: `apps/web-app/src/hooks/queries/useSessions.ts`, `apps/web-app/src/hooks/queries/useMessages.ts`, `apps/web-app/src/hooks/queries/usePermissions.ts`, `apps/web-app/src/hooks/queries/useQuestions.ts`, `apps/web-app/src/hooks/queries/useCommand.ts`, `apps/web-app/src/hooks/usePetActivity.ts`
- [x] 3. Remove unused `sessionApi` helpers and update module mocks/imports that referenced them.
  - verify: `pnpm --filter web-app check-types && ! rg -n 'sessionApi|sessionRequest' apps/web-app/src`
  - files: `apps/web-app/src/lib/cloudy/provider.ts`, `apps/web-app/src/**/*.test.ts`, `apps/web-app/src/**/*.component.test.tsx`
- [ ] 4. Run frontend lint and all tests to validate chat/session interactions and mocks. Lint and typecheck pass; full Vitest has 3 failing interaction tests in `PermissionDialog.component.test.tsx` and `QuestionSheet.component.test.tsx` after the RPC switch.
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run`
  - files: —

## Done when

- [x] All ordinary session and interaction requests formerly made through `sessionApi` use typed `cloudyClient` routes.
- [x] `sessionApi` and its manual URL/request helpers are removed when no runtime consumers remain.
- [ ] Session pagination, message sending/abort, permissions, questions, and command behavior pass relevant tests. Relevant pet activity tests pass; three permission/question UI interaction tests still fail in the full suite.
- [ ] Web app lint, typecheck, and tests pass. Lint and typecheck pass; the full Vitest run reports 3 failures and 894 passes.

## Notes for implementer

- Keep TanStack Query as the owner of server state and preserve query invalidation semantics.
- Keep contracts imports type-only and respect strict TypeScript checks.
- Follow `apps/web-app/AGENTS.md` and root `AGENTS.md` for validation commands.
