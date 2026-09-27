---
title: Centralize Session Listing
slug: centralize-session-listing
id: 20260928-centralize-session-listing
status: ready
created: 2026-09-28
source: planning session 2026-09-28
---

# Plan: Centralize Session Listing

## Why

Session history is currently owned by each provider: the frontend calls
`/api/providers/:providerId/sessions`, so the Home screen cannot present one stable
cross-provider list and provider-native IDs leak into frontend state. Add a Cloudy-owned
session catalog as the source of truth for session metadata and listing, while retaining
provider reference columns for messages and provider-specific actions. This is an
unreleased/internal clean break: new sessions use Cloudy-generated UUIDs, while old
provider-backed sessions and persisted tabs do not need to remain compatible.

## Target file

| Path                                                                  | Action                                                                           |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `packages/server/src/db/schema/sessions.ts`                           | create — Cloudy session catalog with provider reference columns                  |
| `packages/server/src/db/schema/index.ts`                              | edit — export session schemas                                                    |
| `packages/server/drizzle/<generated migration>.sql`                   | create — create tables and indexes                                               |
| `packages/server/src/features/sessions/sessions.model.ts`             | create — Zod DTOs and query/input schemas                                        |
| `packages/server/src/features/sessions/sessions.repository.ts`        | create — Drizzle persistence for the session catalog                             |
| `packages/server/src/features/sessions/sessions.service.ts`           | create — catalog lifecycle and provider resolution                               |
| `packages/server/src/features/sessions/sessions.controller.ts`        | create — `/api/sessions` routes                                                  |
| `packages/server/src/features/sessions/index.ts`                      | create — session feature barrel                                                  |
| `packages/server/src/container.ts`                                    | edit — construct session repository/service                                      |
| `packages/server/src/server.ts`                                       | edit — mount `/api/sessions`                                                     |
| `packages/server/src/providers/provider.registry.ts`                  | edit — expose provider operations through resolved bindings where needed         |
| `packages/server/src/features/providers/providers.controller.ts`      | edit — preserve provider routes as compatibility/internal provider-scoped routes |
| `packages/server/src/features/sessions/*.test.ts`                     | create — service and integration coverage                                        |
| `apps/web-app/src/lib/cloudy/provider.ts`                             | edit — add central session API methods                                           |
| `apps/web-app/src/hooks/queries/useSessions.ts`                       | edit — query and mutate canonical Cloudy sessions                                |
| `apps/web-app/src/lib/opencode/query-keys.ts`                         | edit — remove provider from canonical session list/detail keys where applicable  |
| `apps/web-app/src/features/home/components/RecentSessionsSection.tsx` | edit — render central sessions and provider metadata                             |
| `apps/web-app/src/features/home/components/SessionRow.tsx`            | edit — display provider identity without using it as the primary ID              |
| `apps/web-app/src/components/session/SessionPickerDialog.tsx`         | edit — list central sessions with canonical IDs                                  |
| `apps/web-app/src/features/home/tabs/implementations/chat/meta.ts`    | edit — store canonical UUIDs for new chat tabs                                   |
| `apps/web-app/src/hooks/queries/*.test.ts`                            | create/edit — central session query and mutation coverage                        |

## Context the new session needs

- The current provider-owned boundary is `packages/server/src/features/providers/providers.controller.ts:112-243`. It exposes list/detail/children/status/messages/create/update/delete/fork/abort under `/:providerId/sessions`, and the controller passes provider-native session IDs directly to `ProviderRegistry`.
- `packages/server/src/providers/provider.registry.ts:63-117` is the provider dispatch boundary. The new session service should use it for provider operations; it must not import an OpenCode adapter directly.
- `packages/ai-core/src/session.ts:26-46` is the normalized session vocabulary. Keep `ChatSession.id` as the canonical Cloudy-facing ID, keep `providerId` in the response, and do not expose a new provider SDK DTO. The provider binding stores the provider-native ID separately.
- The canonical session ID is a Cloudy-generated UUID. Do not reuse or expose the provider-native ID as `ChatSession.id`; `provider_session_id` is server-side routing data only.
- Use one table for the current product model: one Cloudy chat session has one execution provider. The `sessions` table stores (`id`, `provider_id`, `provider_session_id`, `title`, `directory`, `parent_id`, `created_at`, `updated_at`, `deleted_at`, `metadata`) with a unique constraint on `(provider_id, provider_session_id)` and an index for recent listing. Do not add a separate binding table unless one logical session later needs multiple provider executions. Keep messages in the provider for this phase; centralize identity and listing first.
- `apps/web-app/src/hooks/queries/useSessions.ts:55-79` currently calls `providerApi.listSessions()` for directory and recent lists, while `RecentSessionsSection.tsx:12-31` derives workspace context from the session directory. Central API responses must retain `directory`, `providerId`, `title`, timestamps, parent identity, and the canonical `id` so this UI does not need a second provider lookup.
- `apps/web-app/src/lib/cloudy/provider.ts:4-64` hard-codes `/api/providers/opencode` and provider-scoped session paths. Add a separate central `/api/sessions` client surface; do not silently change existing provider methods until all consumers are migrated.
- Existing plans `20260927-build-backend-provider-registry.md`, `20260927-migrate-frontend-chat-to-provider-api.md`, and `20260927-support-multiple-agent-providers-ui.md` assume provider-specific execution but do not provide a persistent Cloudy session catalog. This plan is an additional backend ownership layer, not a replacement for provider adapters.
- Compatibility decision: this is not a released product, so do not migrate old localStorage tabs or backfill existing provider sessions. Old tabs/provider IDs may receive `404 Session not found`; users start new sessions through the central API. Do not add a legacy resolve endpoint or compatibility lookup.
- Follow repository conventions from `packages/server/AGENTS.md`: schema validation in `model.ts`, Drizzle-only repository, domain errors in the service, route-level HTTP mapping, manual DI through `container.ts`, and migration generation via `pnpm --filter @repo/server db:generate`. Follow `apps/web-app/AGENTS.md`: server state stays in TanStack Query, use individual Zustand selectors, and bump `tabStore` persistence version only if its serialized shape changes.

## Tasks

- [x] 1. Define the Cloudy session catalog with Cloudy UUID identity, provider reference columns, indexes, exports, and migration.
  - verify: `pnpm --filter @repo/server db:generate && pnpm --filter @repo/server check-types`
  - files: `packages/server/src/db/schema/sessions.ts`, `packages/server/src/db/schema/index.ts`, `packages/server/drizzle/<generated migration>.sql`
- [x] 2. Implement repository and service operations for create, central list/detail, provider lookup, and metadata lifecycle; return a domain 404 when a UUID has no session row.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/sessions/sessions.service.test.ts` covers UUID creation, provider lookup, duplicate provider reference rejection, and unknown-session 404.
  - files: `packages/server/src/features/sessions/sessions.model.ts`, `packages/server/src/features/sessions/sessions.repository.ts`, `packages/server/src/features/sessions/sessions.service.ts`, `packages/server/src/features/sessions/*.test.ts`
- [x] 3. Add `/api/sessions` routes for list/detail/create/update/delete and provider-resolved children, status, messages, and actions, with Zod validation and intentional 404 errors for old or unknown IDs.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/sessions/sessions.integration.test.ts` asserts UUID responses, central list ordering, provider resolution, and 404 for an unknown session.
  - files: `packages/server/src/features/sessions/sessions.controller.ts`, `packages/server/src/features/sessions/index.ts`, `packages/server/src/container.ts`, `packages/server/src/server.ts`, `packages/server/src/providers/provider.registry.ts`
- [x] 4. Wire Cloudy-created session lifecycle writes and normalized event mapping so provider-native events resolve to the Cloudy UUID without exposing provider SDK payloads.
  - verify: `pnpm --filter @repo/server test` passes with a newly created UUID session, an event mapped through `(provider_id, provider_session_id)`, and no legacy backfill path.
  - files: `packages/server/src/features/sessions/sessions.service.ts`, `packages/server/src/features/providers/providers.controller.ts`, `packages/server/src/providers/opencode/*.ts`, `packages/server/src/features/providers/*.test.ts`
- [x] 5. Add frontend central-session client methods and migrate `useSessions` plus its mutations from provider list/detail calls to `/api/sessions`, retaining existing UI-facing fields during the transition.
  - verify: `pnpm --filter web-app exec vitest run src/hooks/queries` passes and no session list hook calls `providerApi.listSessions`.
  - files: `apps/web-app/src/lib/cloudy/provider.ts`, `apps/web-app/src/hooks/queries/useSessions.ts`, `apps/web-app/src/lib/opencode/query-keys.ts`, `apps/web-app/src/hooks/queries/*.test.ts`
- [x] 6. Update Home, session picker, and chat-tab creation/opening to use Cloudy UUIDs and render provider metadata; intentionally do not migrate old persisted tabs.
  - verify: `pnpm --filter web-app exec vitest run src/features/home src/components/session` passes and a new chat tab stores the UUID returned by `/api/sessions`.
  - files: `apps/web-app/src/features/home/components/RecentSessionsSection.tsx`, `apps/web-app/src/features/home/components/SessionRow.tsx`, `apps/web-app/src/components/session/SessionPickerDialog.tsx`, `apps/web-app/src/features/home/tabs/implementations/chat/meta.ts`
- [x] 7. Keep provider-scoped routes as compatibility/internal paths, but ensure no frontend central-session flow calls them directly.
  - verify: repository search shows session list/detail/message hooks use `/api/sessions`, while provider adapter tests remain green.
  - files: `packages/server/src/features/providers/providers.controller.ts`, `apps/web-app/src/lib/cloudy/provider.ts`, remaining session consumers
- [x] 8. Run complete backend and frontend validation, including migration-backed integration tests.
  - verify: `pnpm run lint && pnpm run check-types && pnpm --filter @repo/server test && pnpm --filter web-app exec vitest run`
  - files: —

## Done when

- [x] `GET /api/sessions` returns one ordered Cloudy-owned session list across all registered providers, including `providerId`, directory, title, timestamps, and canonical ID.
- [x] New sessions use Cloudy-generated UUIDs, provider-native IDs are stored only for server-side resolution, and old sessions/tabs may return `404 Session not found`.
- [x] Central detail/messages/actions resolve the correct provider binding, while unknown sessions and bindings return intentional 404 responses.
- [x] The Home screen and session picker use the central query; no frontend session-list code directly enumerates a provider.
- [x] Provider adapters remain responsible for provider APIs and messages, while the central catalog owns session identity and list metadata.
- [x] Database migrations, backend tests, frontend tests, lint, and typecheck pass.

## Notes for implementer

- This is intentionally larger than the repository's preferred single-file handoff plan. If implementation becomes too large, split it after task 2 into `central-session-backend` and `central-session-frontend`; do not mix schema/API work with UI polish.
- Do not add backward compatibility for old provider IDs or persisted tabs. This project is not released; an old tab returning `404 Session not found` is an accepted outcome.
- Do not hard-delete central rows when a provider delete fails; preserve enough metadata to report the failure and define the retry behavior in the service test.
- Do not add a browser-side merge of multiple provider lists. The merge, ordering, deduplication, and binding resolution belong in the server.
- Do not remove `/api/providers/:providerId/sessions` until a repository-wide search confirms no supported consumer remains, but do not use it for new frontend session flows.
- Do not commit as part of implementation. Run `pnpm --filter @repo/server db:generate` after schema edits and include the generated SQL in the change.
