---
title: Run OpenCode Subscription in Backend
slug: run-opencode-subscription-in-backend
id: 20261003-run-opencode-subscription-in-backend
status: ready
created: 2026-10-03
source: planning session 2026-10-03
---

# Plan: Run OpenCode Subscription in Backend

## Why

Cloudy currently starts an OpenCode event subscription only when an SSE consumer calls the provider event hub. If no frontend is connected, OpenCode events are not consumed, so the Cloudy-owned session catalog cannot stay current. Move the upstream subscription into a backend-owned lifecycle, persist session state from normalized events, and make frontend SSE clients consume a fan-out stream that does not control the upstream subscription.

## Target file

| Path                                                                   | Action                                                                                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `packages/ai-core/src/event.ts`                                        | edit — extend normalized events only when session synchronization needs additional fields                          |
| `packages/ai-core/src/provider.ts`                                     | edit — keep upstream subscription contract compatible with a long-lived consumer                                   |
| `packages/server/src/providers/provider.event-hub.ts`                  | edit — separate one backend-owned upstream subscription from downstream subscribers and support fan-out            |
| `packages/server/src/providers/provider.event-hub.test.ts`             | edit — test fan-out, subscriber isolation, abort, and upstream lifecycle                                           |
| `packages/server/src/providers/opencode/opencode.adapter.ts`           | edit — preserve reconnect/abort behavior for the long-lived subscription                                           |
| `packages/server/src/db/schema/sessions.ts`                            | edit — add persisted session status fields if required by the chosen normalized state model                        |
| `packages/server/drizzle/<generated migration>.sql`                    | create — persist any new session state columns                                                                     |
| `packages/server/src/features/sessions/sessions.repository.ts`         | edit — update session state and touch `updatedAt` from normalized events                                           |
| `packages/server/src/features/sessions/sessions.service.ts`            | edit — resolve provider-native IDs and apply event state to the central session catalog                            |
| `packages/server/src/features/sessions/sessions.service.test.ts`       | edit — test event-to-session synchronization and unknown-session behavior                                          |
| `packages/server/src/features/sessions/sessions.integration.test.ts`   | edit — verify persisted state through the Hono/session API                                                         |
| `packages/server/src/container.ts`                                     | edit — construct the backend event/session synchronizer and shared event hub                                       |
| `packages/server/src/server/createServer.ts`                           | edit — start the resident subscription after container creation and stop it during shutdown                        |
| `packages/server/src/server.ts`                                        | edit — expose the shared backend event hub to controllers                                                          |
| `packages/server/src/features/providers/providers.controller.ts`       | edit — stream events from the shared fan-out hub instead of opening an upstream subscription per request           |
| `packages/server/src/features/providers/providers.integration.test.ts` | edit — verify SSE clients receive backend-consumed events and client disconnect does not stop upstream consumption |
| `apps/web-app/src/providers/GlobalEventProvider.tsx`                   | edit — consume the Cloudy proxy/fan-out stream without provider-specific subscription assumptions                  |
| `apps/web-app/src/providers/GlobalEventProvider.component.test.tsx`    | edit — test reconnect and downstream disconnect behavior                                                           |

## Context the new session needs

- `packages/server/src/providers/opencode/opencode.adapter.ts:401-449` exposes `subscribeEvents()` as an `AsyncIterable`; `streamEvents()` already accepts an abort signal and closes the OpenCode SDK stream in `finally`. Preserve this adapter boundary and do not expose OpenCode SDK event types outside the adapter/mapper.
- `packages/server/src/providers/provider.event-hub.ts:12-86` currently creates a new merged upstream subscription inside every `subscribeEvents()` call. Refactor this into a long-lived producer plus zero or more downstream consumers. A frontend request ending must remove only its own consumer, not abort the producer.
- `packages/server/src/features/providers/providers.controller.ts:31-68` currently calls `createProviderEventHub(registry)` locally and consumes that request-scoped stream. The controller must receive the shared hub from wiring, while preserving SSE `connected`, `heartbeat`, normalized event names, and request abort cleanup.
- `packages/server/src/container.ts:42-60` constructs the provider registry and session service but has no resident event lifecycle. The event synchronizer and shared hub should be dependency-injected here; avoid module-level singletons because tests replace providers and databases.
- `packages/server/src/server/createServer.ts:8-49` owns the server lifecycle. Start the backend subscription after the container is built and stop it before the HTTP server is fully closed. Shutdown must abort upstream streams and await cleanup without preventing server stop.
- `packages/server/src/features/sessions/sessions.service.ts:211-218` only maps provider-native event session IDs to Cloudy IDs. Add a separate event-application operation that looks up `(providerId, providerSessionId)`, updates the catalog state/metadata and `updatedAt`, and returns the event mapped to the canonical Cloudy session ID for downstream clients. Events for unknown provider sessions must not create rows implicitly unless an explicit reconciliation policy is added and tested.
- `packages/server/src/db/schema/sessions.ts:10-37` already stores Cloudy identity, provider references, `updatedAt`, `deletedAt`, and JSON metadata. Prefer the smallest persisted state change; if status/run status are added, generate and include a Drizzle migration and keep DTOs derived from the schema/model conventions.
- `packages/ai-core/src/event.ts:17-78` is the normalized event vocabulary. Existing events carry `providerId` and canonical session IDs by contract, and `provider.connection` represents upstream provider state. Do not confuse provider connection state with Cloudy SSE client connection state.
- `packages/server/src/features/sessions/sessions.repository.ts` is the Drizzle-only persistence boundary. Repository methods should perform database updates and return records; provider/event interpretation belongs in the service.
- `apps/web-app/src/providers/GlobalEventProvider.tsx:79-105` already consumes `/api/providers/events`. Keep the browser on the Cloudy-wide route; it must never subscribe directly to OpenCode. The frontend remains a downstream consumer and server state stays in TanStack Query per `apps/web-app/AGENTS.md`.
- Existing plan `docs/plan/20260927-provider-agnostic-event-stream.md` established the normalized Cloudy-wide SSE shape and provider-aware event mapping. This plan changes subscription ownership and lifecycle; it should not reintroduce provider-specific event URLs or raw SDK payloads.
- This is intentionally larger than the plan-generator preferred 1-2-file handoff. If implementation becomes difficult to review, split it after the event-hub work into `backend-resident-event-subscriber` and `session-event-synchronization-and-sse-fanout` without changing the architecture.

## Tasks

- [x] 1. Define the resident subscription ownership API and downstream fan-out semantics, including one producer per provider hub, subscriber add/remove, provider reconnect behavior, and shutdown completion.
  - verify: unit-level API/types compile and the design has one explicit owner for upstream abort; no controller creates a provider subscription directly.
  - files: `packages/server/src/providers/provider.event-hub.ts`, `packages/server/src/providers/provider.event-hub.test.ts`
- [x] 2. Implement the shared event hub producer and downstream subscriptions so the hub starts independently of frontend consumers, broadcasts each normalized event to all active consumers, isolates slow/disconnected consumers, and aborts upstream only during server shutdown.
  - verify: `pnpm --filter @repo/server exec vitest run src/providers/provider.event-hub.test.ts` proves events are received with zero consumers, multiple consumers receive the same event, one consumer abort does not stop another, and shutdown closes the upstream iterator.
  - files: `packages/server/src/providers/provider.event-hub.ts`, `packages/server/src/providers/provider.event-hub.test.ts`, `packages/server/src/providers/opencode/opencode.adapter.ts`
- [x] 3. Add the session synchronization operation that maps `(providerId, providerSessionId)` to a Cloudy session, persists relevant status/run status/title or metadata changes, touches `updatedAt`, and maps the event to the canonical session ID without implicitly creating unknown sessions.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/sessions/sessions.service.test.ts` covers running, idle/completed, failed, unknown, and deleted-session events.
  - files: `packages/server/src/features/sessions/sessions.repository.ts`, `packages/server/src/features/sessions/sessions.service.ts`, `packages/server/src/features/sessions/sessions.service.test.ts`, `packages/ai-core/src/event.ts`
- [x] 4. Add any required persisted session state fields and generate the migration, keeping model/DTO output consistent with the central session API.
  - verify: `pnpm --filter @repo/server db:generate && pnpm --filter @repo/server check-types` passes and the generated migration contains only the intended session schema changes.
  - files: `packages/server/src/db/schema/sessions.ts`, `packages/server/drizzle/<generated migration>.sql`, `packages/server/src/features/sessions/sessions.model.ts`, `packages/server/src/features/sessions/sessions.integration.test.ts`
- [x] 5. Wire the shared hub and synchronizer through the container and server lifecycle; start them once during `createServer.start()` and stop/await them during `createServer.stop()`.
  - verify: lifecycle tests or focused integration assertions show the upstream subscription starts before any SSE request, remains active after all SSE clients disconnect, and is aborted on server stop.
  - files: `packages/server/src/container.ts`, `packages/server/src/server/createServer.ts`, `packages/server/src/server.ts`
- [x] 6. Change the provider controller to consume the shared fan-out stream, apply session synchronization before forwarding events, and retain SSE connected/heartbeat framing and request abort cleanup.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/providers/providers.integration.test.ts src/features/sessions/sessions.integration.test.ts` proves a request receives events produced while no request was connected and a disconnected request does not terminate the backend producer.
  - files: `packages/server/src/features/providers/providers.controller.ts`, `packages/server/src/features/providers/providers.integration.test.ts`, `packages/server/src/server.ts`
- [x] 7. Confirm the frontend is only a downstream SSE client, preserving reconnect behavior and query invalidation while removing any remaining provider-specific subscription assumptions.
  - verify: `pnpm --filter web-app exec vitest run src/providers/GlobalEventProvider.component.test.tsx` passes and repository search finds no browser-side call to `/api/providers/opencode/events` or direct OpenCode event SDK subscription.
  - files: `apps/web-app/src/providers/GlobalEventProvider.tsx`, `apps/web-app/src/providers/GlobalEventProvider.component.test.tsx`
- [x] 8. Run complete validation and inspect lifecycle/error edge cases before handoff.
  - verify: `pnpm run lint && pnpm run check-types && pnpm --filter @repo/server test && pnpm --filter web-app test` passes.
  - files: —

## Done when

- [x] Backend subscribes to OpenCode when the server starts, even if there are zero frontend SSE clients.
- [x] Session events update the Cloudy session catalog and its `updatedAt`/state without requiring a frontend connection.
- [x] Multiple frontend SSE clients receive the same normalized events from one backend-owned upstream subscription.
- [x] Closing the last frontend SSE client does not abort the upstream subscription; server shutdown does abort and await it.
- [x] Provider failures emit provider connection state without killing unrelated downstream consumers.
- [x] No frontend code directly subscribes to OpenCode or uses a provider-specific event URL.
- [x] Backend and frontend tests, lint, typecheck, and migration validation pass.

## Notes for implementer

- Do not use a module-level singleton. Construct the hub through `createContainer()` so tests can replace providers and databases.
- Do not create one upstream OpenCode subscription per browser request.
- Keep Cloudy SSE client connection state separate from `provider.connection` events.
- Do not silently create central session rows from arbitrary provider events; use an explicit reconciliation/backfill plan if that behavior is later needed.
- Follow `packages/server/AGENTS.md`: repositories perform Drizzle queries only, services own domain logic, request/response schemas use Zod, and imports remain ESM/type-only where applicable.
- If the persisted session shape changes, run `pnpm --filter @repo/server db:generate` and include the generated SQL; do not commit as part of implementation.
