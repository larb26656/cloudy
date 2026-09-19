---
title: Extract shared message streaming logic
slug: extract-shared-message-streaming
id: 20260920-extract-shared-message-streaming
status: ready
created: 2026-09-20
source: planning session 2026-09-20
---

# Plan: Extract shared message streaming logic

## Why

The web-app and browser extension need the same OpenCode message assembly behavior, but they
currently implement it independently. The web-app has a Zustand store and freshness merge logic,
while the extension has local `Map` state in `opencode.ts`; this will cause the two clients to
diverge as more message part types are added. Extract a framework-agnostic reducer/assembler so
both apps share protocol behavior while retaining app-specific React wiring.

## Target file

| Path                                                       | Action                                                         |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| `packages/opencode/package.json`                           | create — shared OpenCode client/domain package metadata        |
| `packages/opencode/src/message-stream.ts`                  | create — pure message stream state and reducer                 |
| `packages/opencode/src/message-stream.test.ts`             | create — reducer and merge tests                               |
| `packages/opencode/src/index.ts`                           | create — package barrel                                        |
| `apps/web-app/src/stores/streamingMessagesStore.ts`        | edit — delegate assembly to shared logic                       |
| `apps/browser-extension/entrypoints/sidepanel/opencode.ts` | edit — consume shared assembler                                |
| `pnpm-workspace.yaml`                                      | edit — register package only if the workspace glob requires it |

## Context the new session needs

- `apps/web-app/src/stores/streamingMessagesStore.ts:5-18` defines the current streaming state
  contract and `:69-137` contains the important behavior for part replacement, pending deltas,
  and text/reasoning mutation.
- `apps/web-app/src/lib/opencode/appendStreamingMessages.ts:5-16` merges cached and streaming
  parts by part id; preserve this behavior when reconciling server snapshots.
- `apps/web-app/src/lib/message/freshness.ts` and its tests define how a remote message wins or
  loses against a streaming message. Read them before moving any freshness helper.
- `apps/browser-extension/entrypoints/sidepanel/opencode.ts:117-203` is the second assembler to
  converge with the shared implementation.
- The new package must be framework-agnostic: no React, Zustand, React Query, browser globals,
  or UI imports. It may depend on `@opencode-ai/sdk` and use the shared `Message` shape.
- Preserve app-specific concerns in each app: web-app session maps/selectors and extension
  storage/event subscription stay outside the pure package.

## Tasks

- [x] 1. Scaffold the package and define a public stream state/reducer API around `Message` and `Part`
  - verify: `pnpm --filter @repo/opencode check-types`
  - files: `packages/opencode/package.json`, `packages/opencode/src/index.ts`, `packages/opencode/src/message-stream.ts`
- [x] 2. Move part replacement, pending delta buffering, and text/reasoning delta handling into the pure reducer
  - verify: `pnpm --filter @repo/opencode test` passes for mixed parts and out-of-order events
  - files: `packages/opencode/src/message-stream.ts`, `packages/opencode/src/message-stream.test.ts`
- [x] 3. Replace the web-app store's duplicated assembly branches with the shared reducer while keeping its Zustand API stable
  - verify: `pnpm --filter web-app exec vitest run src/stores/streamingMessagesStore.test.ts`
  - files: `apps/web-app/src/stores/streamingMessagesStore.ts`
- [x] 4. Replace the extension's local assembly implementation with the shared reducer
  - verify: `pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/entrypoints/sidepanel/opencode.ts`
- [x] 5. Run cross-package validation
  - verify: `pnpm run lint && pnpm run check-types`
  - files: —

## Done when

- [x] Web-app and extension use the same pure reducer for message part updates and deltas.
- [x] Existing web-app streaming tests remain green.
- [x] Extension mixed-part streaming behavior remains green.
- [x] The shared package has no React, Zustand, React Query, or browser-runtime dependency.

## Notes for implementer

- Package naming and workspace wiring must follow the root `AGENTS.md` conventions for `packages/*`.
- Do not move UI components into this package; `@repo/ui` remains presentation-only.
- Keep the public API small. Do not add compatibility wrappers unless an existing consumer needs
  one during the migration.
