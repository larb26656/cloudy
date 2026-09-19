---
title: Use React Query for extension server state
slug: extension-react-query-state
id: 20260920-extension-react-query-state
status: completed
created: 2026-09-20
source: planning session 2026-09-20
---

# Plan: Use React Query for extension server state

## Why

The extension currently owns durable session messages in `useState` and loads them manually on
startup and after `session.idle`. The web-app treats OpenCode responses as server state through
TanStack Query, which gives both clients consistent refetch, loading, and error semantics. Add
the same pattern to the extension without putting transient streaming state into React Query.

## Target file

| Path                                                                 | Action                                                                |
| -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `apps/browser-extension/package.json`                                | edit — add TanStack Query dependency                                  |
| `apps/browser-extension/entrypoints/sidepanel/main.tsx`              | edit — provide a QueryClient                                          |
| `apps/browser-extension/entrypoints/sidepanel/query-keys.ts`         | create — extension OpenCode query keys                                |
| `apps/browser-extension/entrypoints/sidepanel/useSessionMessages.ts` | create — session messages query hook                                  |
| `apps/browser-extension/entrypoints/sidepanel/App.tsx`               | edit — consume query state and invalidate/refetch on lifecycle events |

## Context the new session needs

- `apps/browser-extension/entrypoints/sidepanel/App.tsx:42-124` manually loads stored messages,
  reloads them on `session.idle`, and stores them in local state. Replace only durable message
  ownership; keep session id persistence in `browser.storage.local`.
- `apps/web-app/src/hooks/queries/useMessages.ts:22-64` is the reference query shape for
  `session.messages`, including error normalization and pagination direction.
- `apps/web-app/src/providers/QueryProvider.tsx` shows the repository's QueryClient provider
  convention. The extension may use a smaller client configuration suitable for a side panel.
- `apps/web-app/src/lib/opencode/query-keys.ts` is the reference for stable OpenCode query keys.
- Streaming messages are transient and should not be mirrored into the query cache in this plan;
  the shared reducer/Zustand plan owns that layer.
- The extension uses a fixed directory in `opencode.ts:9-22`; include the directory/session id in
  query requests and keys so future multi-directory support does not collide.

## Tasks

- [x] 1. Add TanStack Query and create a QueryClient provider for the side-panel entrypoint
  - verify: `pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/package.json`, `apps/browser-extension/entrypoints/sidepanel/main.tsx`
- [x] 2. Add stable extension query keys and a `useSessionMessages` hook for OpenCode messages
  - verify: `pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/entrypoints/sidepanel/query-keys.ts`, `apps/browser-extension/entrypoints/sidepanel/useSessionMessages.ts`
- [x] 3. Replace `messages` local state and manual durable reloads in `App` with the query result
  - verify: `pnpm --dir apps/browser-extension build`
  - files: `apps/browser-extension/entrypoints/sidepanel/App.tsx`
- [x] 4. Invalidate or refetch the session message query after idle and preserve the existing storage/session error behavior
  - verify: a side-panel manual check shows loaded history, streamed response, idle reconciliation, and error recovery without duplicate messages
  - files: `apps/browser-extension/entrypoints/sidepanel/App.tsx`
- [x] 5. Run extension checks
  - verify: `pnpm --dir apps/browser-extension compile && pnpm --dir apps/browser-extension build`
  - files: —

## Done when

- [x] Durable session messages are owned by TanStack Query rather than `useState`.
- [x] Query loading/error states drive the existing extension message list.
- [x] `session.idle` reconciles the query without duplicating messages.
- [x] Streaming state remains separate from the query cache.

## Notes for implementer

- Do not add React Query to the shared UI package.
- Do not use a query cache as a token-by-token event buffer.
- Keep the current `browser.storage.local` session id behavior unchanged.
