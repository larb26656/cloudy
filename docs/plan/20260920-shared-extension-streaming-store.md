---
title: Share Zustand streaming state with extension
slug: shared-extension-streaming-store
id: 20260920-shared-extension-streaming-store
status: completed
created: 2026-09-20
source: planning session 2026-09-20
---

# Plan: Share Zustand streaming state with extension

## Why

The web-app already uses Zustand for transient streaming messages, while the extension currently
keeps equivalent maps in React state. This makes streaming behavior and render timing different
between the two clients. After the pure stream reducer exists, move the client-facing streaming
store into a shared package and let each app subscribe with its own lifecycle and session scope.

## Target file

| Path                                                       | Action                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `packages/opencode/src/streaming-store.ts`                 | create — shared Zustand streaming store                              |
| `packages/opencode/src/index.ts`                           | edit — export the store contract                                     |
| `packages/opencode/package.json`                           | edit — add Zustand dependency                                        |
| `apps/web-app/src/stores/streamingMessagesStore.ts`        | edit/delete — replace local implementation with shared store adapter |
| `apps/browser-extension/entrypoints/sidepanel/App.tsx`     | edit — subscribe to the shared store instead of local stream state   |
| `apps/browser-extension/entrypoints/sidepanel/opencode.ts` | edit — dispatch events through the shared store/reducer boundary     |

## Context the new session needs

- `apps/web-app/src/stores/streamingMessagesStore.ts:5-18` is the current public store API used by
  `handle-global-event.ts` and `useMessageListData.ts`; preserve consumer-facing actions or make
  an explicit, small migration across all consumers.
- `apps/browser-extension/entrypoints/sidepanel/App.tsx:22-34` owns `emptyStream`, `messages`, and
  stream state in React. Durable messages will already be separated by the React Query plan;
  this plan only moves transient stream maps.
- `apps/web-app/src/components/chat/message/useMessageListData.ts:38-45` demonstrates selector
  discipline. Use individual selectors or shallow selectors; never subscribe to the entire store.
- `packages/opencode/src/message-stream.ts` from the shared reducer plan must remain the single
  source of truth for event application. Zustand should provide state/lifecycle, not duplicate the
  reducer's branching logic.
- The extension is a browser runtime and the web-app is a DOM runtime; the shared store must not
  access either runtime directly.

## Tasks

- [x] 1. Define a shared Zustand store around the pure stream reducer and session-scoped messages
  - verify: `pnpm --filter @repo/opencode check-types`
  - files: `packages/opencode/src/streaming-store.ts`, `packages/opencode/src/index.ts`, `packages/opencode/package.json`
- [x] 2. Add unit tests for session isolation, selector-visible updates, pending deltas, and clearing finalized streams
  - verify: `pnpm --filter @repo/opencode test`
  - files: `packages/opencode/src/streaming-store.test.ts`
- [x] 3. Adapt the web-app's existing store consumers to the shared store without changing rendered behavior
  - verify: `pnpm --filter web-app test`
  - files: `apps/web-app/src/stores/streamingMessagesStore.ts`, `apps/web-app/src/lib/opencode/handle-global-event.ts`, `apps/web-app/src/components/chat/message/useMessageListData.ts`
- [x] 4. Replace extension-local stream React state with store selectors and keep its event subscription app-specific
  - verify: `pnpm --dir apps/browser-extension compile && pnpm --dir apps/browser-extension build`
  - files: `apps/browser-extension/entrypoints/sidepanel/App.tsx`, `apps/browser-extension/entrypoints/sidepanel/opencode.ts`
- [x] 5. Run repository validation
  - verify: `pnpm run lint && pnpm run check-types`
  - files: —

## Done when

- [x] Web-app and extension use the same Zustand streaming state contract.
- [x] Streaming updates remain isolated by session id.
- [x] React Query owns durable messages; Zustand owns only transient streaming state.
- [x] Existing web-app and extension behavior remains covered by tests/builds.

## Notes for implementer

- Complete `extension-full-message-parts` and `extract-shared-message-streaming` first.
- Follow `apps/web-app/AGENTS.md`: use individual Zustand selectors and do not mirror server state
  into Zustand.
- Do not move browser storage, SSE subscription, or UI context into the shared package.
