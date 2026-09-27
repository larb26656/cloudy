---
title: Migrate Extension Events to Provider SSE
slug: extension-provider-events
id: 20260927-extension-provider-events
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Migrate Extension Events to Provider SSE

## Why

The extension still opens its realtime stream through the OpenCode SDK and converts raw
OpenCode `GlobalEvent` payloads in `lib/opencode/events.ts`. Replace that boundary with
Cloudy's normalized provider SSE so extension state consumes `ChatEvent` contracts and the
existing shared stream reducer remains reusable.

## Target file

| Path                                                                          | Action |
| ----------------------------------------------------------------------------- | ------ |
| `apps/browser-extension/entrypoints/sidepanel/lib/cloudy/provider.ts`         | edit   |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/events.ts`         | edit   |
| `apps/browser-extension/entrypoints/sidepanel/hooks/useSessionEventStream.ts` | edit   |
| `apps/browser-extension/entrypoints/sidepanel/tests/opencode.test.ts`         | edit   |
| `apps/browser-extension/entrypoints/sidepanel/tests/hooks.test.tsx`           | edit   |

## Context the new session needs

- The server stream is `GET /api/providers/opencode/events?directory=...` and writes SSE
  `event: <ChatEvent.type>` plus JSON data, as implemented in
  `packages/server/src/features/providers/providers.controller.ts:25-53`.
- `@repo/ai-core/src/event.ts` defines normalized events (`session.status`, message updates,
  deltas, approvals, questions, and failures). The extension must not parse `payload`,
  `sessionID`, `messageID`, or OpenCode `Part` objects.
- `@repo/opencode/src/message-stream.ts` and `streaming-store.ts` already accept normalized
  `ChatEvent`; reuse them. Remove `toChatEvent`/`applyStreamEvent` usage from the extension
  once the server returns normalized events, or reduce the adapter to a typed SSE parser.
- Preserve current behavior in `useSessionEventStream.ts`: filter to the active directory/
  session, update generation state on busy/retry and idle/error, merge streamed messages on
  idle, invalidate session/message queries, and close the stream on cleanup.
- SSE parsing must handle chunked frames and `event`/`data` lines safely; use an abort signal
  tied to the React effect and do not use the SDK's async iterator as a second transport.

## Tasks

- [x] 1. Implement a provider SSE helper that parses normalized `ChatEvent` frames and supports AbortController cleanup.
  - verify: `pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/entrypoints/sidepanel/lib/cloudy/provider.ts`
- [x] 2. Change the extension event boundary and hook to consume `ChatEvent` directly while preserving stream-store reconciliation and query invalidation.
  - verify: `pnpm --dir apps/browser-extension exec vitest run entrypoints/sidepanel/tests/opencode.test.ts entrypoints/sidepanel/tests/hooks.test.tsx && pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/entrypoints/sidepanel/lib/opencode/events.ts`, `apps/browser-extension/entrypoints/sidepanel/hooks/useSessionEventStream.ts`
- [x] 3. Add coverage for split SSE frames, session filtering, idle merge, error handling, and effect cleanup.
  - verify: `pnpm --dir apps/browser-extension exec vitest run entrypoints/sidepanel/tests/opencode.test.ts entrypoints/sidepanel/tests/hooks.test.tsx`
  - files: `apps/browser-extension/entrypoints/sidepanel/tests/opencode.test.ts`, `apps/browser-extension/entrypoints/sidepanel/tests/hooks.test.tsx`

## Done when

- [x] Extension realtime traffic uses `/api/providers/opencode/events` and normalized `ChatEvent` payloads.
- [x] No extension runtime code handles raw OpenCode event payloads or SDK event types.
- [x] Streaming, generation status, idle reconciliation, errors, and cleanup tests pass.

## Notes for implementer

- Keep `@repo/opencode` as the shared reducer/store until cleanup proves it can be replaced; do not copy the reducer into the extension.
- Preserve directory propagation and abort the fetch stream on unmount.
