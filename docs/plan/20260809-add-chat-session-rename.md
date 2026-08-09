---
title: Add inline rename for chat sessions
slug: add-chat-session-rename
id: 20260809-add-chat-session-rename
status: done
created: 2026-08-09
source: planning session 2026-08-09
---

# Plan: Add inline rename for chat sessions

## Why

Chat sessions can be created, opened, and deleted in the UI, but their title is
read-only everywhere it is shown. Users want to rename a chat session in place by
double-clicking the title (matching the existing TextNode/TodoNode inline-edit UX on the
Desk canvas). The outcome: a user can double-click the session title in any of four
surfaces (workspace sidebar list, home "Recent sessions" rows, the open chat's tab chip,
and the Desk chat-node window header) and type a new name that persists to opencode.

## Target file

| Path                                                                          | Action                                                                                             |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `apps/web-app/src/hooks/useInlineRename.ts`                                   | create — reusable rename-state hook wrapping `useUpdateSession`                                    |
| `apps/web-app/src/hooks/useInlineRename.test.ts`                              | create — unit tests for the hook (node vitest project)                                             |
| `apps/web-app/src/components/session/SessionTitleInput.tsx`                   | create — bare `<input>` atom used by every surface                                                 |
| `apps/web-app/src/features/home/components/SessionList.tsx`                   | edit — add per-row `editingId` + double-click → input                                              |
| `apps/web-app/src/features/home/components/SessionRow.tsx`                    | edit — add optional `onRename` prop + double-click handling                                        |
| `apps/web-app/src/features/home/components/RecentSessionsSection.tsx`         | edit — pass rename handler into `SessionRow`                                                       |
| `apps/web-app/src/features/desk/nodes/implementations/WindowFrame.tsx`        | edit — add generic `onRename?` prop; title becomes double-click editable when present              |
| `apps/web-app/src/features/desk/nodes/implementations/chat-node/ChatNode.tsx` | edit — pass `onRename` to `WindowFrame`, calls `useUpdateSession`                                  |
| `apps/web-app/src/features/home/tabs/implementations/chat/meta.ts`            | edit — `ChatTabTitle` returns JSX with double-click → input (return type is already unconstrained) |

Nine files, but a single cohesive feature (rename a chat session title) split across a
shared foundation (hook + atom) and four small consumer edits. Tasks are ordered so the
repo stays in a working state after each one.

## Context the new session needs

### Backend: zero changes

Chat sessions are **not** a cloudy-server feature. They are owned by opencode and reached
through the generic proxy at `packages/server/src/features/proxy/proxy.controller.ts`.
There is no `packages/server/src/features/chat/`, no Drizzle table, nothing in
`@repo/contracts`. **Do not add backend routes, Zod models, or migrations.**

The mutation hook `useUpdateSession` already exists and is fully wired end-to-end at
`apps/web-app/src/hooks/queries/useSessions.ts:174-212`. It calls
`oc.session.update({ sessionID, directory, title, metadata })` through the cloudy proxy
and, on success, invalidates `sessionKeys.root()`, `sessionKeys.infinite(data.directory)`,
and `sessionKeys.detail(data.id)`. The SSE handler at
`apps/web-app/src/lib/opencode/handle-global-event.ts:33-51` already reacts to
`session.updated` events, so a renamed title propagates to every consumer (sidebar, tab
chip, picker, chat-node) automatically once the query invalidates. **As of this writing
`useUpdateSession` is never called by any component** — this plan wires it into the UI.

### The four surfaces and their current title rendering

1. **Sidebar list** — `apps/web-app/src/features/home/components/SessionList.tsx:68-79`.
   Each root session renders as a `<button>` showing `session.title || "New Chat"`. The
   component already has the `directory` prop (line 14) needed for the mutation.
2. **Home recent rows** — `apps/web-app/src/features/home/components/SessionRow.tsx:34-36`
   shows `session.title || "New Chat"` inside a card `<button>` with `onClick`. The parent
   `RecentSessionsSection.tsx:45-58` maps sessions and derives `dir =
session.location.directory` (line 46). `SessionRow` is a presentational component, so
   the rename handler should be passed in as a prop rather than calling the hook inside.
3. **Tab chip** — `apps/web-app/src/features/home/tabs/implementations/chat/meta.ts:16-23`,
   `ChatTabTitle` currently `return session?.title ?? data.sessionName ?? "New Chat"` (a
   string). The `TitleComponent` type is `ComponentType<TabTitleProps<T>>`
   (`apps/web-app/src/features/home/tabs/template/tabTemplates.ts:32`) — **the return type
   is unconstrained, so it can return JSX with no interface change.** The dispatcher
   `apps/web-app/src/features/home/tabs/template/TabTitle.tsx:14` just renders
   `<TitleComponent data={tab.data} />`. `ChatData` (meta.ts:7-14) carries `directory`, so
   the mutation has what it needs.
4. **Desk chat-node** — `apps/web-app/src/features/desk/nodes/implementations/chat-node/ChatNode.tsx:47-62`
   passes a plain `title` string to `WindowFrame`. `WindowFrame.tsx:80-82` renders it in a
   `<span className="text-sm font-medium truncate">`. Adding an optional `onRename` prop
   to `WindowFrame` benefits every window-style node (chat, and future sticky-note-style
   nodes), so do it there rather than special-casing `ChatNode`.

### Reference patterns already in the repo

- **`apps/web-app/src/features/desk/nodes/implementations/text-node/TextNode.tsx`** — the
  canonical "double-click to edit" pattern. Key bits: `isEditing` state (line 33),
  `onDoubleClick={startEditing}` (line 120), `readOnly={!isEditing}` (line 121), auto-focus
  via `useEffect` on `isEditing` (lines 42-44), commit-on-blur + cancel-on-Escape
  (lines 70-84). Mirror this for the hook + atom.
- **`apps/web-app/src/features/desk/nodes/implementations/todo-node/TodoNode.tsx`** — the
  `editingId` pattern for editing one item in a list (lines 23, 142). This is the template
  for `SessionList.tsx`, which edits one row out of many.
- **`apps/web-app/src/hooks/queries/useWorkspaces.ts:76-113` (`useUpdateWorkspace`)** — if
  you later want snappier UX, this is the reference for optimistic update via
  `queryClient.setQueryData`. Not required for v1; the existing
  `invalidateQueries` + SSE path is enough.

### Conventions (from `apps/web-app/AGENTS.md`)

- ESM only. Use `import type { ... }` for type-only imports (`verbatimModuleSyntax` is on).
- No comments unless asked.
- Use TanStack Query for **all server state**; do not mirror session titles into Zustand.
  Call `useUpdateSession` directly at the call site (or via the new `useInlineRename`
  hook) — each call site gets its own mutation state, which is fine.
- Tests: the `node` vitest project matches `src/**/*.test.ts` (pure logic, globals on);
  the `jsdom` project matches `src/**/*.component.test.tsx`. Co-locate tests next to source.
- Stories (optional here) use the `preview.meta(...)` / `meta.story(...)` API, co-located
  as `*.stories.tsx`. Not required for this plan but welcomed for `SessionTitleInput`.

### Edge cases to handle in `useInlineRename`

- Empty / whitespace-only commit → no mutation, revert to previous title.
- Unchanged title on commit → no mutation.
- Renaming during an active message stream is safe — title is independent of the message
  flow.
- Two clients renaming concurrently: SSE invalidation resolves it; last write wins.
- The `sessionName` field persisted in `ChatData` (meta.ts:13) becomes stale after a
  rename, but that is harmless — `ChatTabTitle` reads `session.title` first (meta.ts:22)
  and only falls back to `sessionName` while the session query is still loading. No
  `tabStore` migration is needed.

## Tasks

- [x] 1. **Create `useInlineRename` hook + its unit test.**
     The hook signature: `useInlineRename({ sessionId, directory, initialTitle })`
     returns `{ isEditing, value, isPending, start(), commit(), cancel(), setValue(v) }`.
     `start()` seeds `value` from `initialTitle` and sets `isEditing=true`. `commit()`
     trims, no-ops on empty or unchanged, otherwise calls `useUpdateSession().mutate({
sessionID, directory, title })` and clears `isEditing`. `cancel()` reverts `value`
     and clears `isEditing`. Mirror the editing lifecycle in
     `apps/web-app/src/features/desk/nodes/implementations/text-node/TextNode.tsx:30-86`.
     The test (`useInlineRename.test.ts`) covers: empty-commit no-op, unchanged-commit
     no-op, cancel reverts, valid commit calls mutate with correct args.
  - verify: `pnpm --filter web-app exec vitest run src/hooks/useInlineRename.test.ts` passes
  - files: `apps/web-app/src/hooks/useInlineRename.ts`,
    `apps/web-app/src/hooks/useInlineRename.test.ts`

- [x] 2. **Create `SessionTitleInput` atom.**
     A bare styled `<input>` (auto-focus on mount, commit on blur and Enter, cancel on
     Escape, shows a small spinner when `isPending`). It consumes `useInlineRename`:
     props are `{ sessionId, directory, initialTitle, onDone?: () => void }`. `onDone` is
     called after commit or cancel so the parent can clear its `editingId`. Place under
     `apps/web-app/src/components/session/` (the `session/` folder already exists — see
     `SessionPickerDialog.tsx`). Use `cn(...)` from `@/lib/utils` for classes.
  - verify: `pnpm --filter web-app check-types` passes; the component imports cleanly
  - files: `apps/web-app/src/components/session/SessionTitleInput.tsx`

- [x] 3. **Wire rename into `SessionList` (sidebar).**
     Add `editingId: string | null` state (pattern: `TodoNode.tsx:23`). On the row
     `<button>` (`SessionList.tsx:69-78`), add `onDoubleClick` that calls
     `e.stopPropagation()` then `setEditingId(session.id)`. When `editingId ===
session.id`, render `<SessionTitleInput>` instead of the button, with `onDone={() =>
setEditingId(null)}`. Pass `directory` (already a prop, line 14) and
     `initialTitle={session.title}`.
  - verify: `pnpm --filter web-app check-types` passes; double-clicking a row in the
    sidebar swaps it for an input
  - files: `apps/web-app/src/features/home/components/SessionList.tsx`

- [x] 4. **Wire rename into `SessionRow` + `RecentSessionsSection` (home).**
     Add optional prop `onRename?: (title: string) => void` to `SessionRow`
     (`SessionRow.tsx:6-15`). When present, the title `<span>` (line 34-36) gets
     `onDoubleClick` that `stopPropagation()`s (so the card's `onClick` open-tab handler
     does not fire) and swaps the span for `<SessionTitleInput>` using local `isEditing`
     state. In `RecentSessionsSection.tsx:48-57`, pass `onRename={(title) =>
updateSession.mutate({ sessionID: session.id, directory: dir, title })}` — call
     `useUpdateSession()` at the top of `RecentSessionsSection`. Note: `SessionRow` is a
     pure presentational component; the mutation lives in the parent.
  - verify: `pnpm --filter web-app check-types` passes; double-clicking a recent row's
    title opens an input without also opening the tab
  - files: `apps/web-app/src/features/home/components/SessionRow.tsx`,
    `apps/web-app/src/features/home/components/RecentSessionsSection.tsx`

- [x] 5. **Add `onRename` to `WindowFrame` and wire `ChatNode`.**
     Extend `WindowFrameProps` (`WindowFrame.tsx:15-33`) with `onRename?: (newTitle:
string) => void`. When present, the title `<span>` (lines 80-82) becomes
     double-click editable via local `isEditing` state + `<SessionTitleInput>`
     (the input must carry `nodrag` so React Flow does not start a drag — see
     `TextNode.tsx:133`). In `ChatNode.tsx`, instantiate `useUpdateSession()` and pass
     `onRename={(t) => updateSession.mutate({ sessionID: data.sessionId!, directory,
title: t })}` into `<WindowFrame>` (guard when `data.sessionId` is null). `directory`
     is already derived at `ChatNode.tsx:28`.
  - verify: `pnpm --filter web-app check-types` passes; double-clicking a chat-node window
    header opens an inline input
  - files: `apps/web-app/src/features/desk/nodes/implementations/WindowFrame.tsx`,
    `apps/web-app/src/features/desk/nodes/implementations/chat-node/ChatNode.tsx`

- [x] 6. **Wire rename into the chat tab chip (`ChatTabTitle`).**
     Change `ChatTabTitle` (`meta.ts:16-23`) to return JSX: a `<span onDoubleClick={...}>`
     that toggles a local `isEditing` state and renders `<SessionTitleInput>` when editing,
     otherwise the title text. The interface already allows JSX
     (`TitleComponent: ComponentType<TabTitleProps<T>>` at `tabTemplates.ts:32`); no type
     change needed. Ensure the input `stopPropagation`s on click/keydown so the tab bar's
     chip activation/close handlers do not fire while typing. Read where `TabTitle` is
     placed in the tab bar before editing, to confirm there are no conflicting
     double-click handlers on the chip wrapper.
  - verify: `pnpm --filter web-app check-types` passes; double-clicking the chat tab chip
    opens an inline rename input
  - files: `apps/web-app/src/features/home/tabs/implementations/chat/meta.ts`

- [x] 7. **Full check.**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types` is clean,
    and `pnpm --filter web-app exec vitest run` passes; then manually exercise rename in
    all four surfaces (sidebar list, home recent row, chat tab chip, desk chat-node) and
    confirm the new title appears everywhere within a moment (driven by the SSE
    `session.updated` invalidation)
  - files: —

## Done when

- [x] Double-clicking a session title in the workspace sidebar swaps it for an input;
      committing a non-empty changed name persists and the new name shows across surfaces
- [x] Same behavior on the home "Recent sessions" row, the chat tab chip, and the Desk
      chat-node window header
- [x] Empty / unchanged commits perform no network call and revert the field
- [x] `pnpm --filter web-app exec vitest run src/hooks/useInlineRename.test.ts` passes
- [x] `pnpm --filter web-app lint && pnpm --filter web-app check-types` is clean

## Notes for implementer

- **Scope flag:** this plan touches 9 files across 4 UI surfaces. It exceeds the usual
  single-file plan size, but the work is one cohesive feature built on one shared
  foundation. Tasks 1-2 (the foundation) can be merged and shipped alone; each of tasks
  3-6 is an independent consumer and can be done in any order or skipped. Stop after any
  task and the repo stays in a working state.
- No backend, contracts, schema, or migration work — do not add any.
- ESM only; `import type` for types. No comments unless asked.
- Use `cn(...)` from `@/lib/utils` for conditional classes. Call `useUpdateSession`
  directly (or via `useInlineRename`) at each surface — per `apps/web-app/AGENTS.md`, do
  not mirror session titles into Zustand; TanStack Query + SSE is the source of truth.
- If you find yourself adding an optimistic-update fast path, model it on
  `useUpdateWorkspace` (`apps/web-app/src/hooks/queries/useWorkspaces.ts:76-113`), but it
  is not required for v1 — `invalidateQueries` + the `session.updated` SSE event already
  refresh every consumer.
- Do not bump the `tabStore` version or add a migration: the stale `sessionName` fallback
  in `ChatData` (meta.ts:13) is harmless because `ChatTabTitle` prefers `session.title`.
- If you want to add a Storybook story for `SessionTitleInput`, follow the
  `preview.meta(...)` / `meta.story(...)` pattern documented in `apps/web-app/AGENTS.md`.
