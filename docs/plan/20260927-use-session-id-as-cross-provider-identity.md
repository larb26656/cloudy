---
title: Use session ID as cross-provider identity
slug: use-session-id-as-cross-provider-identity
id: 20260927-use-session-id-as-cross-provider-identity
status: complete
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Use session ID as cross-provider identity

## Why

The thinking indicator can miss a `session.status` event because the normalized event has a `sessionId`, while the frontend status cache is partitioned by `directory`. OpenCode's own `SessionID` is generated as a global `ses_...` identifier for an OpenCode instance; `directory` is session metadata and filtering context, not part of the session identity. The provider-neutral layer should therefore use a canonical session ID, while adapters must namespace and decode provider-native IDs only when a provider does not guarantee global uniqueness.

## Target file

| Path                                                             | Action                                                                                                          |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `packages/ai-core/src/event.ts`                                  | edit — keep normalized events keyed by canonical `sessionId`; do not make `directory` part of identity          |
| `packages/ai-core/src/provider.ts`                               | edit — document the provider adapter identity contract if needed                                                |
| `packages/server/src/providers/opencode/opencode.mapper.ts`      | edit — preserve OpenCode's raw/global session ID without directory prefixing                                    |
| `packages/server/src/providers/opencode/opencode.adapter.ts`     | edit — ensure all session operations consistently use the raw OpenCode ID                                       |
| `apps/web-app/src/lib/opencode/query-keys.ts`                    | edit — define status cache keys around canonical session identity or a safely scoped bulk cache                 |
| `apps/web-app/src/hooks/queries/useSessions.ts`                  | edit — keep bulk status fetching separate from canonical per-session status updates                             |
| `apps/web-app/src/lib/opencode/handle-global-event.ts`           | edit — update only the cache entry matching the event's `sessionId`; never inject it into every directory cache |
| `apps/web-app/src/lib/opencode/handle-global-event.test.ts`      | edit — cover same-session updates across cache scopes and unknown-session events                                |
| `packages/server/src/providers/opencode/opencode.mapper.test.ts` | edit — verify session IDs are preserved                                                                         |

## Context the new session needs

- OpenCode source defines `SessionID` as `ses_` plus a descending timestamp/counter and random bytes in `packages/schema/src/session-id.ts` and `packages/schema/src/identifier.ts`. OpenCode's session lookup uses the ID alone; `directory` is stored on the session and used for listing/filtering.
- The current normalized event model is `packages/ai-core/src/event.ts`. It carries `sessionId` on all event variants. Do not add directory to the identity unless a concrete provider requires it.
- The OpenCode adapter receives the upstream event directory at `packages/server/src/providers/opencode/opencode.adapter.ts:355-383`, but OpenCode's session ID is already globally unique within the provider instance. Do not prefix OpenCode IDs with directory.
- The frontend currently fetches a bulk status map with `providerApi.statuses(directory)` in `apps/web-app/src/hooks/queries/useSessions.ts:111-129`, and the query key is `sessionKeys.statuses(directory)` in `apps/web-app/src/lib/opencode/query-keys.ts`.
- `apps/web-app/src/lib/opencode/handle-global-event.ts:54-86` must update the entry for `event.sessionId`, not all sessions in a directory. If a bulk cache remains directory-scoped, update only caches that already contain that ID; do not create the same ID in unrelated directory caches.
- For a future provider whose native IDs are only unique within a directory, the adapter must define a reversible canonical ID format and apply it consistently to list/get/messages/send/abort/events. A prefix in events alone is invalid because later API calls would receive an ID the provider does not understand.
- The repository uses type-only exports through `packages/contracts/src/index.ts`; changes to `@repo/ai-core` event types flow into the browser contract automatically.
- Follow the frontend rules in `apps/web-app/AGENTS.md`: use individual Zustand selectors, keep server state in TanStack Query, use type-only imports, and run web-app lint/typecheck/tests before finishing.

## Tasks

- [x] 1. Define and document the canonical provider session identity contract, distinguishing canonical IDs from provider-native raw IDs
  - verify: `pnpm --filter @repo/ai-core check-types`
  - files: `packages/ai-core/src/event.ts`, `packages/ai-core/src/provider.ts`
- [x] 2. Verify the OpenCode adapter preserves raw session IDs consistently across session APIs and normalized events
  - verify: `pnpm --filter @repo/server exec vitest run src/providers/opencode/opencode.mapper.test.ts src/providers/opencode/opencode.adapter.test.ts`
  - files: `packages/server/src/providers/opencode/opencode.mapper.ts`, `packages/server/src/providers/opencode/opencode.adapter.ts`, `packages/server/src/providers/opencode/opencode.mapper.test.ts`
- [x] 3. Refactor frontend status caching so bulk directory fetches remain isolated, while event handling updates only the matching canonical session ID
  - verify: `pnpm --filter web-app exec vitest run src/lib/opencode/handle-global-event.test.ts`
  - files: `apps/web-app/src/lib/opencode/query-keys.ts`, `apps/web-app/src/hooks/queries/useSessions.ts`, `apps/web-app/src/lib/opencode/handle-global-event.ts`
- [x] 4. Add regression coverage for an event in one directory, an event without directory metadata, and an unknown session ID
  - verify: `pnpm --filter web-app exec vitest run src/lib/opencode/handle-global-event.test.ts` passes without adding an unknown session to unrelated caches
  - files: `apps/web-app/src/lib/opencode/handle-global-event.test.ts`
- [x] 5. Run the complete validation suite
  - verify: `pnpm run lint && pnpm run check-types && pnpm --filter web-app test && pnpm --filter @repo/server test`
  - files: —

## Done when

- [x] OpenCode events update the status for exactly the matching canonical `sessionId`.
- [x] An event cannot insert a session into every directory-scoped cache.
- [x] OpenCode raw IDs are never prefixed in a way that breaks subsequent provider API calls.
- [x] The identity contract leaves room for adapters to namespace provider-native IDs when required.
- [x] Web and server tests, lint, and typecheck pass.

## Notes for implementer

- Prefer the smallest change that preserves the existing bulk status API. Do not replace bulk fetching with one network request per session unless the query design requires it and the tradeoff is documented in code/tests.
- If a provider-specific canonical ID is introduced, use an unambiguous reversible encoding rather than raw string concatenation with a directory separator.
- Do not revert unrelated worktree changes. Do not commit as part of implementing this plan.
