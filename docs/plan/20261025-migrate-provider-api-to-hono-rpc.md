---
title: Migrate Provider API Calls to Hono RPC
slug: migrate-provider-api-calls-to-hono-rpc
id: 20261025-migrate-provider-api-calls-to-hono-rpc
status: ready
created: 2026-10-25
source: planning session 2026-10-25
---

# Plan: Migrate Provider API Calls to Hono RPC

## Why

The web app's `providerApi` in `src/lib/cloudy/provider.ts` manually constructs URLs, query strings, headers, and fetch calls for routes already mounted on the typed Hono `AppType`. This duplicates the RPC client boundary and leaves request/response contracts unchecked. Route ordinary provider catalog and file/command operations through `cloudyClient`, preserving current React Query behavior and response/error semantics.

## Target file

| Path                                                        | Action                                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `apps/web-app/src/lib/cloudy/provider.ts`                   | edit — remove providerApi hand-built fetch requests once migrated                        |
| `apps/web-app/src/hooks/queries/useAgents.ts`               | edit — use typed provider catalog route                                                  |
| `apps/web-app/src/hooks/queries/useFiles.ts`                | edit — use typed provider file/diff routes                                               |
| `apps/web-app/src/components/chat/extensions/suggestion.ts` | edit — use typed provider file-search/commands routes                                    |
| `apps/web-app/src/hooks/queries/useModels.ts`               | edit — confirm existing RPC catalog use; avoid duplicate catalog helper                  |
| `apps/web-app/src/hooks/queries/*`                          | edit — discover and migrate any further providerApi consumers found by repository search |

## Context the new session needs

- `apps/web-app/src/lib/api.ts:1-18` exports the cached `cloudyClient = hc<AppType>(...)`, with credentials and auth headers configured. Use that as the only ordinary HTTP client; `AppType` is type-only from `@repo/contracts`.
- `apps/web-app/src/lib/cloudy/provider.ts:4-17, 35-49, 51-103` manually builds provider paths, query strings, JSON requests, and headers. `providerApi` is used by `useAgents.ts`, `useFiles.ts`, and chat extension suggestions. Search all references before deleting it.
- Server routes are composed in `packages/server/src/server.ts:78-86`. Provider routes are mounted under `/api/agent-providers`; inspect `packages/server/src/features/providers/providers.controller.ts` for the exact typed route shapes (including provider path parameters and search inputs).
- `apps/web-app/src/hooks/queries/useModels.ts` already fetches `cloudyClient.api["agent-providers"].$get()` and is an in-repo precedent. Preserve query keys, parsed result shapes, and existing UI error behavior when migrating.
- The `sessionApi` functions in the same module are a separate migration scope covered by `20261025-migrate-session-api-to-hono-rpc.md`.
- WebSocket/SSE streaming URLs and Storybook/MSW mock paths are protocol/test concerns; do not treat those as ordinary REST fetches in this change.

## Tasks

- [x] 1. Inventory all runtime `providerApi` consumers and map each operation to the exact `cloudyClient` route method, params, and JSON body.
  - verify: `rg -n 'providerApi' apps/web-app/src --glob '!**/*.stories.*'` returns only the expected consumers before migration, then rerun after migration
  - files: `apps/web-app/src/lib/cloudy/provider.ts`, `apps/web-app/src/hooks/queries/useAgents.ts`, `apps/web-app/src/hooks/queries/useFiles.ts`, `apps/web-app/src/components/chat/extensions/suggestion.ts`
- [x] 2. Migrate provider catalog, files, diff, search, and command requests to typed Hono RPC calls and preserve current query results/errors.
  - verify: `pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run src/hooks/queries`
  - files: `apps/web-app/src/hooks/queries/useAgents.ts`, `apps/web-app/src/hooks/queries/useFiles.ts`, `apps/web-app/src/components/chat/extensions/suggestion.ts`
- [x] 3. Remove the catalog/files/diff/search/commands methods from `providerApi` and verify no runtime REST path construction remains for these routes. `providerApi` remains for session APIs, which are covered by the separate session migration plan.
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && ! rg -n 'providerApi|agent-providers/opencode/(files|file|file-search|diff|commands)|fetch\(providersPath' apps/web-app/src --glob '!**/*.stories.*'`
  - files: `apps/web-app/src/lib/cloudy/provider.ts`, `apps/web-app/src/hooks/queries/useAgents.ts`, `apps/web-app/src/hooks/queries/useFiles.ts`, `apps/web-app/src/components/chat/extensions/suggestion.ts`
- [x] 4. Run the frontend test suite to catch component and Storybook mocks affected by typed calls.
  - verify: `pnpm --filter web-app exec vitest run`
  - files: `apps/web-app/src/**/*.test.ts`, `apps/web-app/src/**/*.component.test.tsx`, `apps/web-app/src/**/*.stories.tsx`

## Done when

- [x] Provider catalog and normal provider file/command HTTP requests use `cloudyClient` routes with inferred request and response types.
- [x] No `providerApi` methods or hand-built fetch requests for catalog/files/diff/search/commands remain; session API migration remains separate.
- [x] Existing query keys, displayed data behavior, and error handling remain covered by passing frontend tests.
- [x] Web app lint, typecheck, and tests pass.

## Notes for implementer

- Keep `@repo/contracts` imports type-only; never add a runtime contracts import.
- Preserve TanStack Query as the owner of server state and retain existing query keys.
- Follow `apps/web-app/AGENTS.md` and root `AGENTS.md`; run frontend lint, typecheck, and relevant tests.
