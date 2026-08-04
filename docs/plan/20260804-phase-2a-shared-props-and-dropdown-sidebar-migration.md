---
title: "Phase 2A: Extend state components + migrate dropdown/sidebar/minimap consumers"
slug: phase-2a-shared-props-and-dropdown-sidebar-migration
id: 20260804-phase-2a-shared-props-and-dropdown-sidebar-migration
status: ready
created: 2026-08-04
source: planning session 2026-08-04 (Phase 1 review)
---

# Plan: Phase 2A — Extend state components + migrate dropdown/sidebar/minimap consumers

## Why

Phase 1 (`docs/plan/20260804-phase-1-state-component-size-variants-storybook.md`) added the
`size` variant to `EmptyState`, `ErrorState`, `LoadingState` and split mascot route-state
into its own folder. Phase 2 migrates the ~16 consumers that still hand-roll inline state
JSX. This plan (2A) is the **foundation**: it extends `ErrorState` and `LoadingState` with
the optional props that downstream consumers need (custom icon, custom retry label,
text-only mode, overlay className, custom spinner, silent spinner), updates the Storybook
stories to cover the new surface, and migrates the simplest 5 consumers (dropdowns, sidebar
list, minimap) as the first proof-of-concept. Subsequent Phase 2 plans (2B desk nodes, 2C
full-panels, 2D inline/overlays) depend on the prop additions made here.

## Target file

| Path                                                             | Action                                                                       |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `apps/web-app/src/components/ui/error-state.tsx`                 | edit — add `className?`, `icon?`, `retryLabel?`, `bare?` props               |
| `apps/web-app/src/components/ui/loading-state.tsx`               | edit — add `className?`, `spinner?`, allow `title: string \| null`           |
| `apps/web-app/src/components/ui/error-state.stories.tsx`         | edit — add `Bare`, `CustomIcon`, `CustomRetryLabel`, `WithClassName` stories |
| `apps/web-app/src/components/ui/loading-state.stories.tsx`       | edit — add `Silent`, `TextOnly`, `CustomSpinner`, `WithClassName` stories    |
| `apps/web-app/src/components/chat/ModelSelector.tsx`             | edit — replace inline loading/error/empty JSX at lines 116-127               |
| `apps/web-app/src/components/chat/AgentSelector.tsx`             | edit — replace inline loading/error/empty JSX at lines 84-95                 |
| `apps/web-app/src/features/home/components/SessionList.tsx`      | edit — replace inline loading/error at lines 36-41 and empty at 69-73        |
| `apps/web-app/src/features/chat/components/CreateChatDialog.tsx` | edit — replace inline loading/empty at lines 130-134                         |
| `apps/web-app/src/components/chat/ChatMinimap.tsx`               | edit — replace inline empty at lines 217-220                                 |

Nine files. The two shared-component edits and the story additions are tightly coupled
(the stories document the new API). The five consumer edits are independent of each other
but all depend on the new props. Single cohesive infrastructure plan.

## Context the new session needs

### What exists today (read these first)

- **`apps/web-app/src/components/ui/error-state.tsx`** (53 lines) — text `ErrorState` with
  props `{ title?="Error", message, onRetry?, size?="full" }`. Always renders `AlertCircle`
  icon (hardcoded) + title (always shown) + message + optional `<Button>Try again</Button>`
  with `RotateCcw`. Three render branches: `inline` (row), `full` (column py-8), `compact`
  (column py-4). Reads `import type { StateSize } from "./empty-state/base"`.
- **`apps/web-app/src/components/ui/loading-state.tsx`** (41 lines) — `LoadingState` with
  props `{ title?="Loading", message?, size?="full" }`. Always renders `Loader2
animate-spin` + title. Three render branches mirroring `ErrorState`. Reads
  `import type { StateSize } from "./empty-state/base"`.
- **`apps/web-app/src/components/ui/empty-state/base.tsx`** (79 lines) — `EmptyState`
  already supports `{ icon?, image?, title, description?, action?, size?, className?,
...HTMLAttributes }`. **No changes needed in this plan.** When `icon` is omitted, no
  badge renders — just the title. Useful for the text-only empty cases in dropdowns.
- **`apps/web-app/src/components/ui/error-state.stories.tsx`** and
  **`apps/web-app/src/components/ui/loading-state.stories.tsx`** — existing stories for
  `Full`/`FullNoRetry`/`Compact`/`Inline` etc. Use `preview.meta(...)` + `meta.story(...)`
  pattern (NOT classic `Meta`/`StoryObj`).
- **`apps/web-app/src/components/chat/ModelSelector.tsx:116-127`** — three inline branches:
  `<Loader2 size-5 animate-spin>` (loading), `<div className="p-4 text-sm text-destructive
text-center">{(error as Error).message}</div>` (error), `<div className="p-4 text-sm
text-muted-foreground text-center">No models found</div>` (empty). All inside a
  `DropdownMenuContent` with `max-h-80 overflow-y-auto` parent.
- **`apps/web-app/src/components/chat/AgentSelector.tsx:84-95`** — mirror of ModelSelector:
  same three branches but copy says "No agents found".
- **`apps/web-app/src/features/home/components/SessionList.tsx:36-41,69-73`** — loading is
  `<p className="text-sm text-muted-foreground">Loading sessions...</p>`, error is
  `<p className="text-sm text-destructive">Failed to load sessions</p>` (no retry), empty is
  `<p className="px-2 py-1.5 text-sm text-muted-foreground">No sessions yet</p>`.
- **`apps/web-app/src/features/chat/components/CreateChatDialog.tsx:130-134`** — inside
  `SessionStep` helper. `<p className="text-sm text-muted-foreground">Loading
sessions...</p>` and `<p className="text-sm text-muted-foreground">No sessions in this
workspace</p>`.
- **`apps/web-app/src/components/chat/ChatMinimap.tsx:217-220`** — inside minimap list:
  `<div className="px-3 py-2 text-xs text-muted-foreground">{searchQuery ? "No matches
found" : "No messages yet"}</div>`. Left-aligned, text-xs.

### Decisions already made (locked, do not revisit)

1. **`ErrorState` new optional props**: `className?: string`, `icon?: LucideIcon`
   (overrides `AlertCircle`), `retryLabel?: string` (overrides `"Try again"`), `bare?:
boolean` (text-only mode for dropdown/sidebar errors). When `bare=true`: ignore
   `size`/`title`/`icon`/`onRetry`, render `<div className={cn("p-4 text-sm text-destructive
text-center", className)}>{message}</div>`. This preserves the current dropdown error
   look exactly.
2. **`LoadingState` new optional props**: `className?: string`, `spinner?: React.ReactNode
| false` (`undefined` = default `Loader2`, `false` = no spinner, `<Node />` = custom),
   and widen `title?: string | null` (`null` or `""` = silent mode, render only the
   spinner). The `silent` mode for `inline` size renders just the spinner in a row; for
   `full`/`compact` renders just the spinner centered.
3. **`EmptyState` is unchanged.** Its existing API already covers all empty-state consumer
   needs (omit `icon` for text-only, use `size="compact"` for dropdowns, `size="inline"`
   for tiny sidebars).
4. **Visual intent is preserved**: dropdown errors stay text-only destructive (via `bare`),
   dropdown loading stays spinner-only (via `title={null}`), sidebar loading stays text-only
   (via `spinner={false}`). No consumer should look noticeably different after migration —
   if it would, prefer keeping the inline JSX and note it in the plan's Notes.
5. **`NoData` is not used in this plan's consumers** — they have specific copy ("No models
   found", "No sessions yet", "No matches found"). Use `EmptyState` directly with the
   custom title.

### Conventions (from `apps/web-app/AGENTS.md`)

- Tailwind v4, `cn(...)` from `src/lib/utils.ts`, `cva` for multi-variant components
  (existing `button.tsx` is the house pattern).
- Icons from `lucide-react` only; `import type { LucideIcon } from "lucide-react"`.
- ESM only; `import type` for type-only imports (`verbatimModuleSyntax` is on).
- No comments unless asked.
- Storybook 10 with `@storybook/tanstack-react` framework. Stories use `preview.meta(...)`
  / `meta.story(...)`. Inside `**/*.stories.*`, `eslint.config.js` relaxes
  `no-explicit-any` and `react-hooks/rules-of-hooks`.
- `ErrorState`/`LoadingState` currently take no `className` — when adding it, mirror
  `EmptyState`'s pattern: spread extra `HTMLAttributes` is overkill here, just merge
  `className` into the outer `<div>` via `cn(...)`.

### Exact prop contracts to implement

**`ErrorState`** — final shape:

```ts
interface ErrorStateProps {
  title?: string; // default "Error"
  message: string;
  onRetry?: () => void;
  size?: StateSize; // default "full"
  className?: string; // NEW — merged into outer container
  icon?: LucideIcon; // NEW — overrides AlertCircle
  retryLabel?: string; // NEW — overrides "Try again"
  bare?: boolean; // NEW — text-only mode (size/title/icon/onRetry ignored)
}
```

Behavior:

- `bare=true`: render only `<div className={cn("p-4 text-sm text-destructive text-center",
className)}>{message}</div>`. Ignore everything else.
- Otherwise: existing layout, but: use `icon ?? AlertCircle` for the icon component; button
  label uses `retryLabel ?? "Try again"`; merge `className` into the outer container via
  `cn(...)`.

**`LoadingState`** — final shape:

```ts
interface LoadingStateProps {
  title?: string | null; // default "Loading"; null/"" = silent (no title row)
  message?: string;
  size?: StateSize; // default "full"
  className?: string; // NEW — merged into outer container
  spinner?: React.ReactNode | false; // NEW — undefined=default Loader2, false=none, <Node/>=custom
}
```

Behavior:

- Resolve the spinner element first: `spinner === false` → null; `spinner === undefined` →
  `<Loader2 className={cn(glyph, "animate-spin")} />` (glyph scales per size); otherwise →
  the ReactNode.
- If `title == null || title === ""`: silent branch — render `<div className={cn(rowOrCol,
pad, className)}>{spinnerEl}</div>` (no title, no message). For `inline` size, the row
  layout still applies.
- Otherwise: existing layout, but use `spinnerEl` in place of the hardcoded `<Loader2>`,
  and merge `className` into the outer container.

### Gotchas

- `LoadingState`'s current default `title` is the string `"Loading"`. Existing callers
  (Phase 1 stories, any other caller) pass either no `title` (gets `"Loading"`) or a
  string. **Do not break them** — keep the default `"Loading"`. The new `null` allowance
  is purely additive.
- `ModelSelector`/`AgentSelector` import `Loader2` from `lucide-react` already (used in
  the inline JSX). After migration, they likely no longer need `Loader2` — remove it from
  the import to keep `noUnusedLocals` happy (strict mode is on).
- `SessionList.tsx` is a side-effect-free component; the inline JSX lives in two separate
  branches (loading/error early-returns at lines 36-41, empty-fallback at line 69-73).
  Both must be migrated; do not miss the empty fallback inside the success branch.
- `ChatMinimap`'s current empty text is `text-xs` left-aligned; `EmptyState size="inline"`
  uses `text-sm` centered. This is a deliberate visual change toward consistency — call it
  out in the plan's Notes so the reviewer is aware. If the visual change is rejected, fall
  back to keeping the inline JSX in this one file.
- For dropdowns (`ModelSelector`, `AgentSelector`), the empty fallback migrates to
  `<EmptyState size="compact" title="No models found" />` (no icon). `EmptyState compact`
  has `py-8` padding which is slightly taller than the current `p-4` — acceptable in a
  `max-h-80` scroll area.

## Tasks

- [ ] 1. **Extend `ErrorState` with new optional props**
  - Add `className?`, `icon?` (type `LucideIcon`), `retryLabel?`, `bare?` to
    `ErrorStateProps`. Implement the `bare` branch first (early return), then thread
    `icon ?? AlertCircle` and `retryLabel ?? "Try again"` into the existing render. Merge
    `className` via `cn(...)` on the outer `<div>` of every branch.
  - verify: `pnpm --filter web-app check-types` clean. Manually open
    `apps/web-app/src/components/ui/error-state.tsx` and confirm the four new props appear
    in `ErrorStateProps` and the `bare` branch is the first early-return.
  - files: `apps/web-app/src/components/ui/error-state.tsx`

- [ ] 2. **Extend `LoadingState` with new optional props**
  - Widen `title?: string | null`. Add `className?`, `spinner?: React.ReactNode | false`.
    Build a `spinnerEl` (false→null, undefined→default Loader2 with size-scaled glyph,
    ReactNode→as-is). Add a silent branch when `title == null || title === ""`. Merge
    `className` via `cn(...)` on the outer `<div>` of every branch.
  - verify: `pnpm --filter web-app check-types` clean. Manually open the file and confirm:
    `spinner={false}` hides the spinner; `title={null}` suppresses the title row; default
    callers (no `title`) still render `"Loading"`.
  - files: `apps/web-app/src/components/ui/loading-state.tsx`

- [ ] 3. **Add new stories covering the new props**
  - In `error-state.stories.tsx`, add: `Bare` (renders just destructive message),
    `CustomIcon` (passes `icon={WifiOff}` from `lucide-react`), `CustomRetryLabel`
    (`retryLabel="Reconnect"`), `WithClassName` (`className="bg-muted/40"` so the wrapper
    is visible).
  - In `loading-state.stories.tsx`, add: `Silent` (`title={null}`, default spinner),
    `TextOnly` (`spinner={false}` with a `title="Loading sessions..."`), `CustomSpinner`
    (`spinner={<RotateCw className="size-5 animate-spin" />}`, `title={null}`),
    `WithClassName`.
  - verify: `pnpm --filter web-app storybook` boots; both `UI/ErrorState` and
    `UI/LoadingState` show the new stories in the sidebar.
  - files: `apps/web-app/src/components/ui/error-state.stories.tsx`,
    `apps/web-app/src/components/ui/loading-state.stories.tsx`

- [ ] 4. **Migrate `ModelSelector`**
  - Replace the three inline branches at lines 116-127 with: loading →
    `<LoadingState size="compact" title={null} />`; error → `<ErrorState size="compact"
bare message={(error as Error).message} />`; empty → `<EmptyState size="compact"
title="No models found" />`. Add the three named imports at the top of the file.
    Remove `Loader2` from the `lucide-react` import if no longer used.
  - verify: `pnpm --filter web-app check-types` clean; `rg "Loader2"
apps/web-app/src/components/chat/ModelSelector.tsx` returns no matches.
  - files: `apps/web-app/src/components/chat/ModelSelector.tsx`

- [ ] 5. **Migrate `AgentSelector`** (mirror of Task 4)
  - Same migration as Task 4 but copy is "No agents found". Add the same three named
    imports. Remove `Loader2` from the `lucide-react` import if no longer used.
  - verify: `pnpm --filter web-app check-types` clean; `rg "Loader2"
apps/web-app/src/components/chat/AgentSelector.tsx` returns no matches.
  - files: `apps/web-app/src/components/chat/AgentSelector.tsx`

- [ ] 6. **Migrate `SessionList`**
  - Replace loading branch (line 37) with `<LoadingState size="inline" title="Loading
sessions..." spinner={false} />`. Replace error branch (line 40) with `<ErrorState
size="inline" bare message="Failed to load sessions" />`. Replace empty fallback
    (lines 69-73) with `<EmptyState size="inline" title="No sessions yet" />`. Add the
    three named imports.
  - verify: `pnpm --filter web-app check-types` clean.
  - files: `apps/web-app/src/features/home/components/SessionList.tsx`

- [ ] 7. **Migrate `CreateChatDialog` (`SessionStep`)**
  - In the `SessionStep` helper (around lines 130-134), replace loading `<p>` with
    `<LoadingState size="inline" title="Loading sessions..." spinner={false} />` and empty
    `<p>` with `<EmptyState size="inline" title="No sessions in this workspace" />`. Add
    the two named imports at the top of the file.
  - verify: `pnpm --filter web-app check-types` clean.
  - files: `apps/web-app/src/features/chat/components/CreateChatDialog.tsx`

- [ ] 8. **Migrate `ChatMinimap`**
  - Replace lines 217-220 with `<EmptyState size="inline" title={searchQuery ? "No matches
found" : "No messages yet"} />`. Add the `EmptyState` named import. Note: this changes
    the visual from `text-xs` left-aligned to `text-sm` centered — call this out in the
    PR/commit message.
  - verify: `pnpm --filter web-app check-types` clean.
  - files: `apps/web-app/src/components/chat/ChatMinimap.tsx`

- [ ] 9. **Full verification**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types` all green;
    `pnpm --filter web-app exec vitest run` passes; `pnpm --filter web-app storybook`
    boots and the `UI/ErrorState` / `UI/LoadingState` groups show the new stories.
  - files: —

## Done when

- [ ] `ErrorState` accepts `className`, `icon`, `retryLabel`, `bare` props and renders the
      `bare` branch as a text-only destructive message.
- [ ] `LoadingState` accepts `className`, `spinner` props and renders silent mode
      (`title={null}`) as a spinner-only block.
- [ ] `error-state.stories.tsx` and `loading-state.stories.tsx` each have at least 4 new
      stories covering the new props.
- [ ] `ModelSelector`, `AgentSelector`, `SessionList`, `CreateChatDialog`, `ChatMinimap`
      no longer hand-roll inline state JSX — each uses one of `EmptyState` / `ErrorState`
      / `LoadingState`.
- [ ] `rg "Loader2.*animate-spin" apps/web-app/src/components/chat` returns no matches
      (the two selectors no longer hand-roll spinners).
- [ ] `pnpm --filter web-app lint && pnpm --filter web-app check-types` clean.
- [ ] `pnpm --filter web-app exec vitest run` passes.

## Notes for implementer

- This plan is the **foundation for Phase 2B/2C/2D**. The new `ErrorState`/`LoadingState`
  props (especially `className`, `spinner`, `bare`, `icon`, `retryLabel`, `silent title`)
  are intentionally generic because downstream plans (2B desk nodes, 2C full panels, 2D
  inline/overlays) depend on them — do not specialize the API for dropdowns only.
- Tasks 4-8 (consumer migrations) are independent of each other; you can do them in any
  order or stop after any one and the repo will still build.
- The `ChatMinimap` migration introduces a small visual change (text-sm centered vs.
  text-xs left-aligned). If the reviewer pushes back, revert just that file — the rest of
  the plan stands on its own.
- Do not migrate `routes/settings/index.tsx`, `WorkspaceSelectStep.tsx`,
  `file-update-viewer/index.tsx`, `ChatEmptyState.tsx` — those are Plan 2C. Do not migrate
  `MermaidNode.tsx`, `TodoNode.tsx` — those are Plan 2B. Do not migrate
  `InfiniteScrollTrigger.tsx`, `ErrorConnectionNotify.tsx`, `TerminalView.tsx`,
  `WebviewContent.tsx` — those are Plan 2D.
- Match the existing `EmptyState`/`ErrorState`/`LoadingState` style — read the current
  files end-to-end before editing. Do not introduce `cva` unless the file already uses it
  (it doesn't — both use plain `cn(...)`).
- Commit choreography suggestion (do not commit unless asked): Tasks 1+2+3 as one commit
  ("extend ErrorState/LoadingState with className/icon/spinner/bare"), Tasks 4-8 as one
  commit ("migrate dropdown/sidebar/minimap consumers to shared state components").
