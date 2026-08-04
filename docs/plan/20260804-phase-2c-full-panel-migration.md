---
title: "Phase 2C: Migrate full-panel state JSX to shared components"
slug: phase-2c-full-panel-migration
id: 20260804-phase-2c-full-panel-migration
status: done
created: 2026-08-04
source: planning session 2026-08-04 (Phase 1 review)
---

# Plan: Phase 2C — Migrate full-panel state JSX to shared components

## Why

Five consumers render state JSX in **full-panel** contexts (main content area, settings
pane, dialog body) and hand-roll the layout instead of using the shared
`EmptyState`/`ErrorState`/`LoadingState`. Each is a textbook fit for the existing
`size="full"` variant — no new props needed beyond what Phase 1 already ships. Migrating
them removes ~40 lines of duplicate centered-column JSX and aligns the visual language
(workspaces empty, settings index, file-update-viewer placeholder, chat "select a chat",
chat-content loading) with the rest of the app.

## Target file

| Path                                                                       | Action                                                                              |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `apps/web-app/src/features/workspace/WorkspaceSelectStep.tsx`              | edit — replace hand-rolled empty (lines 28-41) with `EmptyState`                    |
| `apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx` | edit — replace loading `<div>` (lines 15-21) with `LoadingState`                    |
| `apps/web-app/src/components/file-update-viewer/index.tsx`                 | edit — replace "Select a file to view" placeholder (lines 65-71) with `EmptyState`  |
| `apps/web-app/src/routes/settings/index.tsx`                               | edit — replace hand-rolled Settings icon + text (lines 4-13) with `EmptyState`      |
| `apps/web-app/src/components/chat/ChatEmptyState.tsx`                      | edit — replace `SelectSessionState` (lines 124-133) with `EmptyState`-backed render |

Five files, all in different features but all the same mechanical pattern (full-panel
state JSX → shared component). Independent of each other.

## Context the new session needs

### What exists today (read these first)

- **`apps/web-app/src/components/ui/empty-state/base.tsx`** (79 lines) — `EmptyState`
  supports `{ icon?, image?, title, description?, action?, size?, className?,
...HTMLAttributes }`. Default `size="full"` gives `py-16` column with optional icon
  badge (`size-16 rounded-full bg-muted`), `text-lg font-semibold` title, `text-sm
max-w-md` description, `mt-4` action. **This is the size to use for all five consumers.**
- **`apps/web-app/src/components/ui/loading-state.tsx`** — `LoadingState` supports
  `{ title?="Loading", message?, size?="full", className? }`. Default `size="full"` gives
  `py-8 px-4` column with `Loader2 size-5 animate-spin` + `font-medium` title + optional
  muted message.
- **`apps/web-app/src/components/ui/error-state.tsx`** — text `ErrorState`. Not needed for
  any consumer in this plan (the one error case, `ChatContent`'s "Workspace not found", is
  already migrated).
- **`apps/web-app/src/features/workspace/WorkspaceSelectStep.tsx:28-41`** — when
  `workspaces.length === 0`, renders `<div className="flex flex-col items-center gap-4
py-8 text-center"><FolderOpen className="size-12 text-muted-foreground" /><div><p
className="font-medium">No workspaces yet</p><p className="text-sm
text-muted-foreground">Create a workspace first</p></div><Button
onClick={onGoToWorkspaces}>Go to Workspaces</Button></div>`. This is a textbook
  `EmptyState` shape: icon + title + description + action. **This file already imports
  `LoadingState`** for its loading branch (line 22) — but bypasses `EmptyState` for the
  empty branch.
- **`apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx:15-21`** —
  when `isLoading`, renders `<div className="h-full flex items-center justify-center
text-muted-foreground text-sm">Loading workspace...</div>`. **This file already imports
  `ErrorState`** for its `!workspace` branch (line 25) but bypasses `LoadingState`. The
  inline loading has no spinner — to preserve that, use `<LoadingState title="Loading
workspace..." spinner={false} />` (requires Phase 2A's `spinner` prop). If 2A is not
  merged, fall back to `<LoadingState title="Loading workspace..." />` (adds a spinner —
  visual improvement, not regression).
- **`apps/web-app/src/components/file-update-viewer/index.tsx:65-71`** — `renderContent`
  early-returns when `!currentFile`: `<div className="flex items-center justify-center
h-full text-muted-foreground">Select a file to view</div>`. No icon. Maps to
  `<EmptyState title="Select a file to view" />` (no icon → no badge, just the title).
- **`apps/web-app/src/routes/settings/index.tsx`** (17 lines, whole component) —
  `SettingsIndexPage` returns `<div className="hidden h-full items-center justify-center
p-8 md:flex"><div className="text-center text-muted-foreground"><Settings
className="mx-auto mb-3 size-10" /><p>Select a setting from the menu on the
left.</p></div></div>`. Maps to `<EmptyState icon={Settings} title="Select a setting from
the menu on the left." className="hidden md:flex" />` — note the `hidden md:flex` is for
  mobile hiding and must be preserved on the outer container via `className`.
- **`apps/web-app/src/components/chat/ChatEmptyState.tsx:124-133`** — `SelectSessionState`
  returns `<div className="flex-1 flex items-center justify-center bg-muted"><div
className="text-center text-gray-500 dark:text-gray-400"><p className="text-lg
font-medium">Select a chat</p><p className="text-sm">Choose a chat from the sidebar to
start</p></div></div>`. Maps cleanly to `<EmptyState title="Select a chat"
description="Choose a chat from the sidebar to start" className="bg-muted" />`. Note:
  other exports in this file (`WelcomeState`, `EmptyChatState`, `SnippetButtons`) are
  richer greeting+snippet screens and are **NOT** in scope.

### Decisions already made (locked, do not revisit)

1. **`EmptyState size="full"` for all five consumers.** Full-panel contexts get the
   roomiest variant. None of these are dropdowns/dialogs/desk-nodes.
2. **`settings/index.tsx` keeps `hidden md:flex` on the outer container** — that class
   currently lives on the root `<div>` and hides the placeholder on mobile (where the
   settings layout collapses). Pass it via `EmptyState`'s `className` prop, which merges
   into the outer container.
3. **`WorkspaceSelectStep` keeps `FolderOpen` as the icon** — `EmptyState` accepts any
   `LucideIcon`, so pass `icon={FolderOpen}`. The current `size-12 text-muted-foreground`
   styling will be replaced by `EmptyState`'s default badge look (`size-16 rounded-full
bg-muted` with `size-8` glyph). This is a deliberate visual alignment — call it out in
   the commit message.
4. **`ChatContent` loading**: if Phase 2A's `spinner={false}` prop is available, use it to
   preserve the text-only look. If 2A is not yet merged, fall back to default `LoadingState`
   (adds a spinner, slight visual change). Either way the migration is correct.
5. **`SelectSessionState`'s `bg-muted` background is preserved** via `className="bg-muted"`
   on `EmptyState`. The `flex-1` parent sizing is the caller's responsibility, not
   `EmptyState`'s.
6. **`file-update-viewer`'s placeholder has no icon** — pass `title` only, omit `icon`.
   `EmptyState` handles the no-icon case (renders just the title).

### Conventions (from `apps/web-app/AGENTS.md`)

- Tailwind v4, `cn(...)` from `src/lib/utils.ts`.
- Icons from `lucide-react` only; `import type { LucideIcon }` for type-only imports.
- ESM only; `import type` for type-only imports.
- No comments unless asked.
- Routes live in `src/routes/`; `routes/settings/index.tsx` uses `createFileRoute` from
  `@tanstack/react-router`. The `Route` export and `createFileRoute("/settings/")` call
  must be preserved.

### Gotchas

- `WorkspaceSelectStep.tsx` already imports `LoadingState` and `FolderOpen`. After
  migration, `FolderOpen` is still used (passed to `EmptyState`'s `icon` prop) — keep the
  import.
- `ChatEmptyState.tsx` exports four things (`SnippetButtons`, `WelcomeState`,
  `SelectSessionState`, `EmptyChatState`). **Only `SelectSessionState` changes.** Do not
  touch the other three — they are rich greeting screens, not plain empty states.
- `settings/index.tsx` is a route file. The `Route` export and the `createFileRoute` call
  are required by TanStack Router's file-based routing — keep them. Only the
  `SettingsIndexPage` component body changes.
- `file-update-viewer/index.tsx` is a complex resizable layout. Only the
  `if (!currentFile)` early-return at lines 65-71 changes. The mobile/tablet branches and
  resizable panels are untouched.
- `EmptyState`'s `title` is a string — `settings/index.tsx`'s current copy ("Select a
  setting from the menu on the left.") is a single sentence; pass it as `title`. Do not
  split into title + description.

## Tasks

- [x] 1. **Migrate `WorkspaceSelectStep` empty branch**
  - Replace the JSX at lines 28-41 with: `<EmptyState icon={FolderOpen} title="No
workspaces yet" description="Create a workspace first" action={<Button
onClick={onGoToWorkspaces}>Go to Workspaces</Button>} />`. Add `import { EmptyState }
from "@/components/ui/empty-state"`. Keep the existing `LoadingState` and `FolderOpen`
    imports.
  - verify: `pnpm --filter web-app check-types` clean.
  - files: `apps/web-app/src/features/workspace/WorkspaceSelectStep.tsx`

- [x] 2. **Migrate `ChatContent` loading branch**
  - Replace lines 15-21 with `<LoadingState title="Loading workspace..." spinner={false}
className="h-full" />` (if Phase 2A's `spinner` prop exists) or `<LoadingState
title="Loading workspace..." className="h-full" />` (fallback). Add `import {
LoadingState } from "@/components/ui/loading-state"`. Keep the existing `ErrorState`
    import.
  - verify: `pnpm --filter web-app check-types` clean. If `spinner={false}` errors with
    "unknown prop", Phase 2A is not merged — use the fallback.
  - files: `apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx`

- [x] 3. **Migrate `file-update-viewer` placeholder**
  - Replace lines 65-71 (`if (!currentFile)` branch's returned JSX) with `<EmptyState
title="Select a file to view" className="h-full" />`. Add `import { EmptyState } from
"@/components/ui/empty-state"`.
  - verify: `pnpm --filter web-app check-types` clean.
  - files: `apps/web-app/src/components/file-update-viewer/index.tsx`

- [x] 4. **Migrate `settings/index.tsx`**
  - Replace the `SettingsIndexPage` body (lines 5-12) with: `return ( <EmptyState
icon={Settings} title="Select a setting from the menu on the left." className="hidden
h-full md:flex" /> );`. Add `import { EmptyState } from "@/components/ui/empty-state"`.
    Keep the `Settings` import from `lucide-react`, the `createFileRoute` call, and the
    `Route` export.
  - verify: `pnpm --filter web-app check-types` clean. Open the file and confirm
    `createFileRoute("/settings/")` is still called and `Route` is still exported.
  - files: `apps/web-app/src/routes/settings/index.tsx`

- [x] 5. **Migrate `ChatEmptyState.SelectSessionState`**
  - Replace the `SelectSessionState` function body (lines 124-133) with: `return (
<EmptyState title="Select a chat" description="Choose a chat from the sidebar to
start" className="flex-1 bg-muted" /> );`. Add `import { EmptyState } from
"@/components/ui/empty-state"` at the top of the file. Do **not** modify
    `SnippetButtons`, `WelcomeState`, or `EmptyChatState`.
  - verify: `pnpm --filter web-app check-types` clean. Open the file and confirm the other
    three exports are unchanged.
  - files: `apps/web-app/src/components/chat/ChatEmptyState.tsx`

- [x] 6. **Full verification**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types` all green;
    `pnpm --filter web-app exec vitest run` passes.
  - files: —

## Done when

- [x] All five consumers use `EmptyState` or `LoadingState` instead of hand-rolled
      centered JSX.
- [x] `rg "Select a file to view|Select a setting from the menu|No workspaces yet|Loading
  workspace|Select a chat" apps/web-app/src --glob "*.tsx" -l` returns matches only in
      `*.stories.tsx` files or in the shared `EmptyState`/`LoadingState` callsites (not in
      hand-rolled `<p>`/`<div>` blocks).
- [x] `routes/settings/index.tsx` still calls `createFileRoute("/settings/")` and exports
      `Route`.
- [x] `ChatEmptyState.tsx` still exports `SnippetButtons`, `WelcomeState`,
      `SelectSessionState`, `EmptyChatState`.
- [x] `pnpm --filter web-app lint && pnpm --filter web-app check-types` clean.
- [x] `pnpm --filter web-app exec vitest run` passes.

## Notes for implementer

- **Order-independent with Phase 2A, 2B, 2D** — you can do this plan before, after, or in
  parallel with the others. The one exception is Task 2 (`ChatContent`): if you want the
  text-only loading (no spinner), Phase 2A's `spinner={false}` must be merged first;
  otherwise the fallback `<LoadingState title="Loading workspace..." />` works (adds a
  spinner).
- Do not migrate `ModelSelector`/`AgentSelector`/`SessionList`/`CreateChatDialog`/
  `ChatMinimap` (those are Plan 2A), `MermaidNode`/`TodoNode` (Plan 2B), or
  `InfiniteScrollTrigger`/`ErrorConnectionNotify`/`TerminalView`/`WebviewContent` (Plan 2D).
- Visual changes to expect (call out in the commit message):
  - `WorkspaceSelectStep`: `FolderOpen` icon goes from `size-12` bare to `size-16` badge
    with `size-8` glyph. Slightly different look, more consistent with other empty states.
  - `settings/index.tsx`: `Settings` icon goes from `size-10` bare to `size-16` badge.
  - Others: minimal visual change.
- Commit choreography suggestion (do not commit unless asked): Tasks 1-5 as a single
  commit ("migrate full-panel state JSX to shared components").
