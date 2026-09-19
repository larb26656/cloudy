---
title: Add chat header and session sidebar
slug: add-chat-header-and-session-sidebar
id: 20260920-add-chat-header-and-session-sidebar
status: ready
created: 2026-09-20
source: planning session 2026-09-20
---

# Plan: Add chat header and session sidebar

## Why

Chat currently exposes `New chat` and `Change session` only through the overflow menu in
`ChatSessionMenu`, while the chat content has no persistent session navigation surface. Add a
chat shell with a reusable package `AppBar` header and an app-owned session sidebar so users
can see and switch sessions directly, start a new chat, and retain the existing chat/tab state
and session query behavior.

## Target file

| Path                                                                                    | Action                                                                                           |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx`              | edit — compose header, session sidebar, and chat content                                         |
| `apps/web-app/src/features/home/tabs/implementations/chat/ChatSessionSidebar.tsx`       | create — query-backed session navigation for a chat tab                                          |
| `apps/web-app/src/components/chat/ChatSessionMenu.tsx`                                  | edit — keep menu behavior aligned with the sidebar actions or remove duplicated trigger behavior |
| `apps/web-app/src/components/chat/ChatContainer.tsx`                                    | edit — expose only the minimum session-change/header seam required by the shell, if needed       |
| `apps/web-app/src/features/home/tabs/implementations/bot-chat/BotChatHeaderActions.tsx` | edit — preserve bot-chat session actions when the shared shell is applied                        |

## Context the new session needs

- The live chat tab is mounted by `apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx:26-113`.
  It already owns the tab-specific `sessionId`, `directory`, `workspace`, file panel state,
  and `updateTabData`; use those seams rather than adding a second session store.
- `apps/web-app/src/hooks/queries/useSessions.ts:42-57` is the source of truth for sessions.
  Filter out child sessions with `!session.parentID`, as `SessionList.tsx:64` and
  `SessionPickerDialog.tsx:33` already do. Loading, error, and empty states must use the
  shared `LoadingState`, `ErrorState`, and `EmptyState` components, with `size="inline"` for
  the sidebar.
- A session switch is currently represented by `updateTabData(tab.id, { sessionId })` in
  `ChatHeaderActions.tsx:20-26`; a new chat is `sessionId: null`. Keep that behavior so the
  active tab remains the owner of the selected session and the existing ChatProvider reset/
  message-query lifecycle continues to work.
- `ChatSessionMenu.tsx:45-55` already defines the intended actions and labels: `New chat` and
  `Change session`. The sidebar should make these actions direct; retain the menu only if it
  still provides a useful compact/mobile fallback, avoiding two conflicting implementations.
- `ChatContainer.tsx:102-172` already renders the message/input surface and a session picker
  dialog. Do not move query/state orchestration into `@repo/ui`; the package owns visual
  primitives only. The new sidebar is app-specific because it calls `useSessions` and updates
  tab data.
- `HomePage.tsx:17-49` already supplies the global tab bars and `TabHeaderBar`; do not create
  a second full-page tab bar. The new AppBar should be the chat surface header or a focused
  replacement for the current chat header action strip, with the existing file-panel action
  and session actions preserved.
- Follow `apps/web-app/AGENTS.md`: individual Zustand selectors only, TanStack Query for
  server state, `@repo/ui` primitives for shared UI, responsive behavior for desktop/mobile,
  and no hand-rolled loading/error/empty panels. Respect `DESIGN.md`: grayscale tokens,
  border-based depth, compact IDE density, and no decorative shadows.

## Tasks

- [ ] 1. Define `ChatSessionSidebar` with a direct New chat action and query-backed root-session rows
  - verify: `pnpm --filter web-app check-types` passes; the component uses `useSessions({ directory })`, filters child sessions, and renders `LoadingState`/`ErrorState`/`EmptyState` for its states
  - files: `apps/web-app/src/features/home/tabs/implementations/chat/ChatSessionSidebar.tsx`
- [ ] 2. Compose the chat shell around the existing `ChatContainer` with package `AppBar`, responsive sidebar behavior, and tab-owned session changes
  - verify: `pnpm --filter web-app check-types` passes; selecting a sidebar row calls `updateTabData` with that session id and New chat sets `sessionId` to `null`
  - files: `apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx`
- [ ] 3. Reconcile the overflow menu and bot-chat header actions with the new shell without duplicating or breaking session switching
  - verify: `pnpm --filter web-app exec vitest run src/components/chat/ChatSessionMenu.component.test.tsx` passes and both chat and bot-chat header action files typecheck
  - files: `apps/web-app/src/components/chat/ChatSessionMenu.tsx`, `apps/web-app/src/components/chat/ChatContainer.tsx`, `apps/web-app/src/features/home/tabs/implementations/bot-chat/BotChatHeaderActions.tsx`
- [ ] 4. Add or update focused component coverage for New chat, selecting a session, loading, empty, and error states
  - verify: `pnpm --filter web-app exec vitest run src/components/chat/ChatSessionMenu.component.test.tsx` and the new sidebar/chat shell test file both pass
  - files: `apps/web-app/src/features/home/tabs/implementations/chat/ChatSessionSidebar.component.test.tsx`, `apps/web-app/src/components/chat/ChatSessionMenu.component.test.tsx`
- [ ] 5. Run the frontend quality gates
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run`
  - files: —

## Done when

- [ ] Chat displays a header using the package-owned `AppBar` without duplicating the global tab bar.
- [ ] Desktop users can see a session sidebar, click a session to switch the active chat tab, and click New chat to clear the session selection.
- [ ] Mobile users retain an accessible compact/mobile route to the same session actions and the existing file panel behavior.
- [ ] Existing ChatProvider, message loading, session picker dialog, bot-chat actions, and tab persistence continue to work.
- [ ] Loading, error, and empty sidebar states use the shared state components and all web-app checks pass.

## Notes for implementer

- Implement the sidebar as app code, not in `@repo/ui`; package components cannot depend on web-app hooks, stores, or opencode SDK types.
- Avoid adding a new global `selectedSessionId` store. The active tab's `data.sessionId` is already the canonical client state for this surface.
- Keep `directory` in every session query and session-change path; opencode sessions are directory-scoped.
- If the current global `TabHeaderBar` makes a second header visually redundant, adjust that host bar as part of this plan rather than stacking two headers.
- Do not commit unless explicitly asked.
