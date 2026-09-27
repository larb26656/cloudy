---
title: Migrate Frontend Chat to Provider API
slug: migrate-frontend-chat-to-provider-api
id: 20260927-migrate-frontend-chat-to-provider-api
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Migrate Frontend Chat to Provider API

## Why

Even after model catalog migration, the frontend still depends on OpenCode SDK sessions,
messages, global events, permissions, and question payloads. Move those provider-specific
operations behind the backend adapter so the browser consumes normalized `@repo/ai-core`
contracts and the OpenCode SDK can eventually be removed from the web app.

## Target file

| Path                                                                   | Action                                                                            |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `packages/server/src/providers/provider.adapter.ts`                    | edit/create — complete session, message, SSE event, and interaction adapter port  |
| `packages/server/src/providers/opencode/opencode.adapter.ts`           | edit — implement the complete OpenCode adapter surface and upstream SSE lifecycle |
| `packages/server/src/features/providers/providers.controller.ts`       | edit — add sessions, messages, SSE events, and interaction routes                 |
| `packages/server/src/features/providers/providers.model.ts`            | edit — add Zod request/response schemas                                           |
| `packages/server/src/features/providers/providers.integration.test.ts` | edit — cover the new API surface                                                  |
| `apps/web-app/src/hooks/queries/useSessions.ts`                        | edit — use Cloudy provider routes                                                 |
| `apps/web-app/src/hooks/queries/useMessages.ts`                        | edit — use normalized Cloudy messages                                             |
| `apps/web-app/src/lib/opencode/handle-global-event.ts`                 | edit/delete — consume normalized Cloudy events or remove after event migration    |
| `apps/web-app/src/providers/GlobalEventProvider.tsx`                   | edit — subscribe through the Cloudy event endpoint                                |
| `apps/web-app/src/components/permission/*`                             | edit — use normalized interaction contracts                                       |
| `apps/web-app/src/components/question/*`                               | edit — use normalized interaction contracts                                       |
| `apps/web-app/src/lib/opencode/oc-instance.ts`                         | delete — remove browser OpenCode client after all consumers migrate               |
| `apps/web-app/package.json`                                            | edit — remove direct OpenCode SDK dependency if unused                            |

## Context the new session needs

- `packages/ai-core/src/event.ts:5-59` already defines normalized session status, message,
  delta, approval, question, and failure events. Extend only when an actual current frontend
  use case cannot be represented; do not copy OpenCode `GlobalEvent` types into the contract.
- `packages/ai-core/src/session.ts` and `message.ts` are the response vocabulary. The backend
  adapter must perform all `sessionID`/`messageID`/`Part` conversion.
- `packages/opencode/src/adapter.ts:329-383` currently normalizes a subset of global events.
  Preserve its behavior, but place the authoritative implementation behind the server
  provider adapter. Do not make the frontend call this mapper after migration.
- `apps/web-app/src/hooks/queries/useSessions.ts` and `useMessages.ts` currently call
  `getOcClient()` directly. Replace query functions with typed Cloudy RPC calls while keeping
  existing query keys and UI-facing result shapes where possible.
- `apps/web-app/src/providers/GlobalEventProvider.tsx` currently opens the OpenCode SSE stream.
  The replacement must connect to Cloudy's provider SSE endpoint, preserve reconnect behavior,
  propagate cleanup/abort on unmount, and preserve query invalidation semantics in
  `handle-global-event.ts`. It must not parse OpenCode `GlobalEvent` payloads anymore.
- The backend SSE endpoint is the ownership boundary: the provider adapter consumes the
  upstream OpenCode stream, maps each event to `ChatEvent`, and the controller writes valid
  `text/event-stream` frames. Define the frame format and keepalive/close behavior in the
  provider feature tests before changing the frontend.
- Keep `/api/oc` until all consumers are migrated, then remove it in a separate cleanup change
  only if no supported browser/runtime still depends on the proxy.
- Follow `packages/server/AGENTS.md` for Zod validation and domain error handling, and
  `apps/web-app/AGENTS.md` for TanStack Query server state and frontend type-only contracts.

## Tasks

- [x] 1. Complete the adapter port for sessions, messages, normalized SSE events, approvals,
     and questions
  - verify: `pnpm --filter @repo/server exec vitest run src/providers/opencode src/features/providers`
  - files: `packages/server/src/providers/provider.adapter.ts`, `packages/server/src/providers/opencode/opencode.adapter.ts`, `packages/ai-core/src/*.ts`
- [ ] 2. Add normalized provider routes, SSE framing, abort handling, and integration coverage
  - verify: `pnpm --filter @repo/server test` passes with session/message/SSE/interaction cases; the SSE test asserts `text/event-stream`, event names/data, and upstream cleanup after request abort
  - files: `packages/server/src/features/providers/providers.controller.ts`, `packages/server/src/features/providers/providers.model.ts`, `packages/server/src/features/providers/providers.integration.test.ts`
- [ ] 3. Migrate session and message queries from OpenCode SDK to Cloudy RPC
  - verify: `pnpm --filter web-app exec vitest run src/hooks/queries`
  - files: `apps/web-app/src/hooks/queries/useSessions.ts`, `apps/web-app/src/hooks/queries/useMessages.ts`
- [ ] 4. Migrate realtime events and interaction responses to normalized contracts over Cloudy SSE
  - verify: `pnpm --filter web-app exec vitest run src/providers src/lib/opencode src/components/permission src/components/question`; provider event tests show reconnect and unmount cleanup
  - files: `apps/web-app/src/providers/GlobalEventProvider.tsx`, `apps/web-app/src/lib/opencode/handle-global-event.ts`, `apps/web-app/src/components/permission/*`, `apps/web-app/src/components/question/*`
- [ ] 5. Remove frontend OpenCode SDK usage after repository-wide search is clean
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types` and search finds no runtime `getOcClient`/OpenCode SDK imports
  - files: `apps/web-app/src/lib/opencode/oc-instance.ts`, `apps/web-app/package.json`, remaining frontend consumers
- [ ] 6. Run full repository validation
  - verify: `pnpm run lint && pnpm run check-types && pnpm --filter @repo/server test && pnpm --filter web-app exec vitest run`
  - files: —

## Done when

- [ ] Frontend sessions, messages, events, approvals, and questions use Cloudy provider routes.
- [ ] OpenCode SDK types and provider-specific field names do not cross the backend API boundary.
- [ ] Existing chat streaming, query invalidation, permission, and question behavior remains green.
- [ ] No frontend runtime code imports or instantiates the OpenCode SDK.
- [ ] `pnpm run lint`, `pnpm run check-types`, backend tests, and frontend tests pass.

## Notes for implementer

- Implement `20260927-build-backend-provider-registry.md` and
  `20260927-migrate-frontend-model-catalog-to-provider-api.md` first.
- Do not remove `/api/oc` until a repository-wide search confirms it has no supported consumer.
- Keep the normalized event union provider-agnostic; store raw provider payloads only as
  optional `unknown` metadata when necessary for reconciliation/debugging.
