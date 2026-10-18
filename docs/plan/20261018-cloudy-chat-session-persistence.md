---
title: Persist Cloudy Chat Sessions and Messages
slug: cloudy-chat-session-persistence
id: 20261018-cloudy-chat-session-persistence
status: complete
created: 2026-10-18
source: planning session 2026-10-18
---

# Plan: Persist Cloudy Chat Sessions and Messages

## Why

Cloudy's chat provider keeps its sessions and messages in in-memory maps, so session operations fail and chat history disappears when the server restarts. Persist Cloudy message records in SQLite and use the existing central `sessions` table as the source of session identity, so existing session APIs can retrieve durable Cloudy conversations without introducing a second session catalog.

## Target file

| Path                                                                  | Action                                                                         |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `packages/server/src/db/schema/cloudy-messages.ts`                    | create — persist Cloudy chat messages and their parts                          |
| `packages/server/src/db/schema/index.ts`                              | edit — export the message schema                                               |
| `packages/server/drizzle/<generated migration>.sql`                   | create — add the Cloudy message table and indexes                              |
| `packages/server/src/features/sessions/cloudy-messages.repository.ts` | create — provide Drizzle-only message persistence operations                   |
| `packages/server/src/providers/cloudy/cloudy.adapter.ts`              | edit — replace in-memory message storage with the repository                   |
| `packages/server/src/container.ts`                                    | edit — create and inject the Cloudy message repository and session catalog     |
| `packages/server/src/providers/cloudy/cloudy.adapter.test.ts`         | edit — test durable message and session behavior                               |
| `packages/server/src/features/sessions/sessions.integration.test.ts`  | edit — test messages through the existing session API after reopening services |

## Context the new session needs

- `packages/server/src/db/schema/sessions.ts:11-43` defines the central session table. `SessionsService.create()` creates the provider session first, then records a Cloudy-generated canonical session ID alongside `providerId` and `providerSessionId` in `packages/server/src/features/sessions/sessions.service.ts:49-79`.
- The existing `SessionsService.messages()` delegates to the selected provider adapter and remaps provider session IDs back to canonical Cloudy IDs at `packages/server/src/features/sessions/sessions.service.ts:153-169`. Keep using the existing `/api/sessions/:sessionId/messages` contract.
- `packages/server/src/providers/cloudy/cloudy.adapter.ts:15-30,59-124` currently stores sessions/messages in a local `Map`. Do not add another durable session table: the central `sessions` table already owns canonical/provider session identity and survives restart. Persist Cloudy message rows keyed by the Cloudy provider's `providerSessionId`; inject/use the existing `SessionsRepository` for session lookups so `getSession()` can reconstruct provider session data after restart without an adapter-local session map.
- Store message parts as JSON so all current `@repo/ai-core` `MessagePart` variants remain representable. Preserve the current message IDs and timestamps; order/paginate consistently with `listMessages({ limit, before })`.
- `packages/server/src/container.ts:53-96` constructs the provider registry and session persistence. Construct `SessionsRepository` before the Cloudy adapter so both it and the message repository can be injected; keep service/event wiring through this composition root and do not add module-level singletons.
- `packages/server/AGENTS.md` requires Drizzle-only repository methods, Zod-derived DTO types, and migration generation after schema edits. Tests use `createTestDb()` / `closeTestDb()`.
- The plan `docs/plan/20261018-configure-llm-provider-connections-backend.md` also edits `cloudy.adapter.ts`. Complete that plan first, or coordinate the shared adapter edits, to avoid overwriting runtime default-provider changes.

## Tasks

- [x] 1. Define the Cloudy message table with provider-session key, role, JSON parts, timestamps, stable ordering, and any required indexes.
  - verify: `pnpm --filter @repo/server db:generate` creates a migration adding only the intended Cloudy message schema, and `pnpm --filter @repo/server check-types` passes.
  - files: `packages/server/src/db/schema/cloudy-messages.ts`, `packages/server/src/db/schema/index.ts`, `packages/server/drizzle/<generated migration>.sql`
- [x] 2. Implement repository operations to append messages, list a session's messages with the existing `limit`/`before` pagination semantics, and remove messages when a Cloudy session is deleted.
  - verify: focused repository tests cover chronological ordering, pagination cursor behavior, isolation between provider session IDs, and deletion cleanup.
  - files: `packages/server/src/features/sessions/cloudy-messages.repository.ts`, `packages/server/src/features/sessions/cloudy-messages.repository.test.ts`
- [x] 3. Inject both repositories and replace Cloudy's in-memory session/message maps with central-session lookups and SQLite-backed message reads/writes.
  - verify: `pnpm --filter @repo/server exec vitest run src/providers/cloudy/cloudy.adapter.test.ts` passes, including a newly created adapter reconstructing a session and reading messages written by a previous adapter using the same database.
  - files: `packages/server/src/providers/cloudy/cloudy.adapter.ts`, `packages/server/src/container.ts`, `packages/server/src/providers/cloudy/cloudy.adapter.test.ts`
- [ ] 4. Verify history through existing session endpoints after reconstructing the container against the same SQLite database.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/sessions/sessions.integration.test.ts` proves a Cloudy session's message history is available after adapter/service reconstruction.
  - files: `packages/server/src/features/sessions/sessions.integration.test.ts`
- [ ] 5. Run server validation for the persistence change.
  - verify: `pnpm --filter @repo/server test && pnpm --filter @repo/server lint && pnpm --filter @repo/server check-types` passes.
  - files: —

## Done when

- [x] Cloudy user and assistant messages are stored in SQLite rather than an adapter-local map.
- [ ] Existing session message APIs return persisted messages with stable order and pagination after a server/container restart.
- [x] Messages remain isolated by Cloudy provider session ID and retain their message parts and timestamps.
- [ ] The generated Drizzle migration is included and server tests, lint, and typecheck pass.

## Notes for implementer

- Keep repository methods limited to database queries; message/session orchestration belongs in the provider adapter or service layer.
- Do not duplicate canonical sessions in a new table; the `sessions` table remains authoritative for the Cloudy-facing session identity.
- Run `pnpm --filter @repo/server db:generate` after schema changes and include the generated SQL migration.
- Follow `packages/server/AGENTS.md`: ESM, type-only imports, and no comments unless asked.
