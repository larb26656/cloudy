---
title: Migrate OpenCode streaming to AI core types
slug: migrate-opencode-streaming-to-ai-core-types
id: 20260927-migrate-opencode-streaming-to-ai-core-types
status: completed
created: 2026-09-27
source: migration follow-up
---

# Plan: Migrate OpenCode streaming to AI core types

## Why

`@repo/ai-core` now defines provider-agnostic `ChatMessage`, `MessagePart`, and
`ChatEvent` types, and `@repo/opencode` has an OpenCode adapter. The streaming reducer
and Zustand store still expose OpenCode SDK types (`GlobalEvent`, `Part`, and the
`{ info, parts }` message wrapper), so provider-specific fields can still leak into
consumers.

Move the reducer's canonical state to AI core types while keeping provider conversion at
the OpenCode boundary. The migration must account for the shared browser-extension and
web-app consumers before changing the public store contract.

## Target files

| Path                                                                  | Action                                                                        |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `packages/opencode/src/message-stream.ts`                             | edit — use `ChatMessage`, `MessagePart`, and `ChatEvent` as the reducer model |
| `packages/opencode/src/message-stream.test.ts`                        | edit — cover normalized message and event reducers                            |
| `packages/opencode/src/streaming-store.ts`                            | edit — expose normalized state and event methods                              |
| `packages/opencode/src/streaming-store.test.ts`                       | edit — update store fixtures and assertions                                   |
| `packages/opencode/src/streaming-display-items.ts`                    | edit — consume normalized message fields                                      |
| `packages/opencode/src/message-reconciliation.ts`                     | edit — reconcile normalized messages and parts                                |
| `apps/web-app/src/lib/opencode/handle-global-event.ts`                | edit — normalize SDK events before updating the store                         |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/events.ts` | edit — use the same normalized event boundary                                 |
| `apps/web-app/src/lib/opencode/appendStreamingMessages.ts`            | edit — reconcile normalized messages with query data at the UI boundary       |
| `apps/web-app/src/types/message.ts`                                   | edit — define the explicit UI conversion boundary                             |

## Context

- `packages/opencode/src/adapter.ts` already exports `toChatMessage` and `toChatEvent`.
  Keep all OpenCode SDK field mapping there; do not import `@opencode-ai/sdk` into
  `@repo/ai-core`.
- `packages/ai-core/src/message.ts` defines `ChatMessage` with `sessionId`, `role`,
  `parts`, and ISO `createdAt`. Its `MessagePart` union includes text, reasoning, tool,
  file, diff, subtask, compaction, and unknown parts.
- `packages/ai-core/src/event.ts` defines normalized event names such as
  `message.updated`, `message.part.updated`, `message.delta`, and `session.status`.
- The current reducer in `packages/opencode/src/message-stream.ts` creates messages with
  `info.sessionID` and applies SDK `Part` values directly. The store in
  `packages/opencode/src/streaming-store.ts` is re-exported by both web-app and the
  browser extension, so change its contract only after both consumers are migrated.
- `packages/opencode/src/streaming-display-items.ts` and
  `packages/opencode/src/message-reconciliation.ts` currently read `message.info.id`,
  `message.info.role`, and SDK part shapes. These are the main internal consumers to
  migrate together with the reducer.
- `apps/web-app/src/lib/opencode/handle-global-event.ts` currently handles raw
  `GlobalEvent` and manually forwards SDK message/part values to the store. Normalize at
  this boundary, then keep query invalidation and notification behavior unchanged.
- `apps/browser-extension/entrypoints/sidepanel/lib/opencode/events.ts` calls
  `applyEvent` directly with raw SDK events and must use the same adapter path.
- Do not migrate presentational message components in this plan. They still need an
  explicit view-model adapter because many components render OpenCode-specific part
  variants. That is a separate follow-up.
- Preserve the existing out-of-order delta behavior: deltas are buffered by `partId`,
  appended to text/reasoning parts, and ignored for non-text parts.
- Follow repository conventions: ESM, type-only imports, strict TypeScript, no runtime
  dependency from `@repo/ai-core`, and no comments unless needed.

## Tasks

- [x] 1. Change the pure reducer to use AI core message and part types, including a
     normalized `applyChatEvent` entry point for `ChatEvent`.
  - verify: `pnpm --filter @repo/opencode exec vitest run src/message-stream.test.ts`
  - files: `packages/opencode/src/message-stream.ts`, `packages/opencode/src/message-stream.test.ts`
- [x] 2. Update reconciliation and display-item helpers to use `ChatMessage` fields and
     preserve ordering/freshness semantics.
  - verify: `pnpm --filter @repo/opencode exec vitest run src/message-reconciliation.test.ts src/streaming-display-items.test.ts`
  - files: `packages/opencode/src/message-reconciliation.ts`, `packages/opencode/src/streaming-display-items.ts`
- [x] 3. Update the shared Zustand store and its tests to expose normalized messages and
     normalized event application without changing session cleanup behavior.
  - verify: `pnpm --filter @repo/opencode exec vitest run src/streaming-store.test.ts`
  - files: `packages/opencode/src/streaming-store.ts`, `packages/opencode/src/streaming-store.test.ts`
- [x] 4. Normalize raw OpenCode events at the web-app and browser-extension boundaries,
     retaining existing query invalidation, notifications, and idle flushing behavior.
  - verify: `pnpm --filter web-app exec vitest run src/lib/opencode/handle-global-event.test.ts` and the extension typecheck
  - files: `apps/web-app/src/lib/opencode/handle-global-event.ts`, `apps/browser-extension/entrypoints/sidepanel/lib/opencode/events.ts`
- [x] 5. Add the explicit boundary conversion needed by web-app query data and confirm no
     presentational component is accidentally forced to consume AI core types yet.
  - verify: `pnpm --filter web-app check-types`
  - files: `apps/web-app/src/lib/opencode/appendStreamingMessages.ts`, `apps/web-app/src/types/message.ts`
- [x] 6. Run package and repository verification.
  - verify: `pnpm --filter @repo/opencode test && pnpm run lint && pnpm run check-types`
  - files: —

## Done when

- The canonical streaming state in `@repo/opencode` contains only AI core message and
  part types.
- Raw OpenCode SDK events are converted at adapter boundaries rather than in the pure
  reducer or shared store.
- Web-app and browser-extension streaming behavior, including buffered deltas and idle
  flushing, remains covered by passing tests.
- Existing message UI components continue working through an explicit boundary and are
  not silently coupled to provider-agnostic fields.
