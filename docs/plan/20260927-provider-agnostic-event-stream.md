---
title: Build Provider-Agnostic Event Stream
slug: provider-agnostic-event-stream
id: 20260927-provider-agnostic-event-stream
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Build Provider-Agnostic Event Stream

## Why

The browser currently subscribes directly to an OpenCode-specific event route, so adding Codex or another provider would require provider-specific URLs and lifecycle logic in the UI. Cloudy needs one provider-agnostic event stream that multiplexes normalized events from all registered providers while preserving the source provider and isolating provider connection failures.

## Target file

| Path                                                                   | Action                                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `packages/ai-core/src/event.ts`                                        | edit — add provider identity and provider connection event types               |
| `packages/ai-core/src/provider.ts`                                     | edit — keep provider subscriptions as normalized adapter streams               |
| `packages/server/src/providers/provider.event-hub.ts`                  | create — multiplex provider subscriptions and manage abort/error isolation     |
| `packages/server/src/features/providers/providers.controller.ts`       | edit — expose the Cloudy-wide SSE stream                                       |
| `packages/server/src/features/providers/providers.model.ts`            | edit — define SSE envelope/connection schemas if runtime validation is needed  |
| `packages/server/src/features/providers/providers.integration.test.ts` | edit — test multiplexing, abort, and provider failure behavior                 |
| `apps/web-app/src/providers/GlobalEventProvider.tsx`                   | edit — consume the provider-agnostic event endpoint instead of an OpenCode URL |
| `apps/web-app/src/lib/opencode/handle-global-event.ts`                 | edit — route events using `providerId` and handle provider connection events   |
| `apps/web-app/src/lib/opencode/query-keys.ts`                          | edit — scope session/message status keys by provider where needed              |
| `apps/web-app/src/lib/opencode/handle-global-event.test.ts`            | edit — cover multi-provider event routing and isolation                        |

## Context the new session needs

- The current browser connection is hard-coded at `apps/web-app/src/providers/GlobalEventProvider.tsx:79` to `/api/providers/opencode/events`. Replace the browser dependency on the provider ID with one Cloudy-wide endpoint.
- The current adapter boundary already exposes `ProviderAdapter.subscribeEvents(input): AsyncIterable<ChatEvent>` at `packages/ai-core/src/provider.ts:128`, and the OpenCode adapter wraps `client.global.event()` in `packages/server/src/providers/opencode/opencode.adapter.ts:409-443`. Keep this as the upstream provider contract; do not make adapters produce SSE frames.
- `packages/ai-core/src/event.ts` currently defines `ChatEvent` variants without `providerId`. Every normalized event must carry its source provider so session IDs and client caches cannot collide across providers. Use the generic field name `providerId`.
- Add a normalized `provider.connection` event for `connected`, `disconnected`, and `reconnecting` states. Cloudy SSE connection status and individual provider connection status are different states: one provider failing must not terminate the browser stream for other providers.
- The event hub should subscribe to all providers registered in `ProviderRegistry`, merge their async iterables, forward normalized events, and stop all upstream subscriptions when the browser request aborts. It must catch provider-local failures and emit a provider connection event instead of rejecting the entire merged stream.
- The existing controller and tests live in `packages/server/src/features/providers/providers.controller.ts` and `providers.integration.test.ts`. Preserve the SSE framing, keepalive/connected behavior, and abort cleanup already covered by the provider migration plans.
- The frontend currently updates caches and streaming state in `apps/web-app/src/lib/opencode/handle-global-event.ts`. Provider-aware query keys should be introduced only where the same session ID can collide; do not duplicate server state into Zustand. `streamingMessagesStore` remains client-only in-flight state, but its session scope must be checked against provider identity.
- Existing provider migration plans are prerequisites: `docs/plan/20260927-build-backend-provider-registry.md`, `docs/plan/20260927-migrate-frontend-chat-to-provider-api.md`, and `docs/plan/20260927-use-session-id-as-cross-provider-identity.md`. This plan changes the event transport from a provider-specific route to a multiplexed route; it does not add a second provider implementation.
- Follow `packages/server/AGENTS.md` for Zod-first route schemas, domain error handling, ESM/type-only imports, and tests. Follow `apps/web-app/AGENTS.md` for TanStack Query server state, individual Zustand selectors, and frontend test projects.

## Tasks

- [x] 1. Extend the normalized event vocabulary with `providerId` and provider connection events
  - verify: `pnpm --filter @repo/ai-core check-types && pnpm --filter @repo/ai-core lint` passes, and all existing event fixtures include a provider identity
  - files: `packages/ai-core/src/event.ts`, `packages/ai-core/src/index.ts`
- [x] 2. Update the OpenCode adapter and mapper to emit provider-scoped normalized events without leaking SDK event types
  - verify: `pnpm --filter @repo/server exec vitest run src/providers/opencode` asserts `providerId: "opencode"` on mapped events and preserves existing session/message mappings
  - files: `packages/server/src/providers/opencode/opencode.mapper.ts`, `packages/server/src/providers/opencode/opencode.adapter.ts`, `packages/server/src/providers/opencode/*.test.ts`
- [x] 3. Implement a provider event hub that multiplexes subscriptions and isolates provider failures
  - verify: unit tests assert events from two fake providers are yielded in one stream, abort closes all subscriptions, and one provider failure emits a provider disconnect event without ending other providers
  - files: `packages/server/src/providers/provider.event-hub.ts`, `packages/server/src/providers/provider.event-hub.test.ts`
- [x] 4. Add the Cloudy-wide SSE route and retain temporary compatibility for the existing provider route only if current migration consumers still require it
  - verify: integration tests assert `Content-Type: text/event-stream`, provider IDs in event frames, connected/heartbeat behavior, multi-provider forwarding, and upstream cleanup after request abort
  - files: `packages/server/src/features/providers/providers.controller.ts`, `packages/server/src/features/providers/providers.model.ts`, `packages/server/src/features/providers/providers.integration.test.ts`
- [x] 5. Migrate the frontend global event connection to the Cloudy-wide endpoint
  - verify: frontend source contains no hard-coded `/api/providers/opencode/events` fetch in `GlobalEventProvider`, and the provider event provider tests cover reconnect and abort cleanup
  - files: `apps/web-app/src/providers/GlobalEventProvider.tsx`
- [x] 6. Route normalized events and caches by provider identity
  - verify: event handler tests show OpenCode and Codex events with the same native session ID update separate cache/state entries, while provider connection failures do not mark the Cloudy SSE connection as disconnected
  - files: `apps/web-app/src/lib/opencode/handle-global-event.ts`, `apps/web-app/src/lib/opencode/query-keys.ts`, `apps/web-app/src/lib/opencode/handle-global-event.test.ts`, `apps/web-app/src/stores/streamingMessagesStore.ts`
- [x] 7. Run complete validation and search for remaining provider-specific event transport assumptions
  - verify: `pnpm run lint && pnpm run check-types && pnpm --filter @repo/server test && pnpm --filter web-app test` passes; repository search finds no frontend dependency on a provider-specific event URL
  - files: —

## Done when

- [x] The browser opens one Cloudy-wide SSE connection and does not select OpenCode or Codex event URLs.
- [x] Every normalized chat event identifies its source with `providerId`.
- [x] Events from multiple providers are multiplexed into the same stream without session/cache collisions.
- [x] A provider subscription failure is represented as provider connection state and does not kill unrelated provider events.
- [x] Browser disconnect/abort stops every upstream provider subscription.
- [x] Existing message streaming, session status, approval, question, error, notification, and reconnect behavior remains green.
- [x] Server and frontend lint, typecheck, and tests pass.

## Notes for implementer

- Do not make the frontend subscribe once per provider. Provider subscription lifecycle belongs to the server event hub.
- Do not expose OpenCode `GlobalEvent` or Codex-native event payloads through the API. Normalize them at the adapter boundary; keep raw data only as optional `unknown` metadata when necessary for debugging.
- Do not treat Cloudy SSE connection status as provider connection status. They need separate state models.
- Keep `/api/providers/:providerId/events` temporarily only when an active migration consumer still needs it; mark it as deprecated and remove it in a follow-up cleanup after repository-wide search.
- The `subtask` message part is a normalized message part, not a provider transport event. Preserve it through `message.part.updated` rather than adding an OpenCode-specific event type.
