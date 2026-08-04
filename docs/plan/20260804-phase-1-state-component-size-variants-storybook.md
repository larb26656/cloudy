---
title: "Phase 1: State component size variants + Storybook"
slug: phase-1-state-component-size-variants-storybook
id: 20260804-phase-1-state-component-size-variants-storybook
status: ready
created: 2026-08-04
source: planning session 2026-08-04
---

# Plan: Phase 1 — State component size variants + Storybook

## Why

The web-app has a family of shared state components (`EmptyState`, `ErrorState`,
`LoadingState`, plus mascot-based route states) but ~15 feature files still hand-roll
inline empty/error/loading JSX. The root cause: the shared components only come in one
(full-panel) size, so they don't fit in dropdowns, dialogs, desk nodes, or minimaps —
forcing developers to write inline state UI. There is also an `ErrorState` name collision
(two files export `ErrorState` with different looks/APIs), and `NoData` uses a mascot image
in content-level contexts where an icon would be more appropriate.

Phase 1 establishes the foundation: reorganize the folder structure to remove the name
collision, convert `NoData` to icon-based, add a `size` variant (`full` | `compact` |
`inline`) to the three content-level state components, and add Storybook stories covering
every variant so the design can be reviewed **before** any consumer is migrated. **No
consumer files are touched in Phase 1** — Phase 2 (a separate plan) will migrate the inline
call sites once the variant design is approved.

## Target file

| Path                                                                 | Action                                                     |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| `apps/web-app/src/components/ui/empty-state/base.tsx`                | edit — add `size` variant                                  |
| `apps/web-app/src/components/ui/empty-state/no-data.tsx`             | edit — icon-based, drop mascot, pass `size` through        |
| `apps/web-app/src/components/ui/empty-state/index.ts`                | edit — drop `ErrorState`/`NotFound` re-exports             |
| `apps/web-app/src/components/ui/error-state.tsx`                     | edit — add `size` variant                                  |
| `apps/web-app/src/components/ui/loading-state.tsx`                   | edit — add `size` variant                                  |
| `apps/web-app/src/components/ui/route-state/error-state.tsx`         | create — moved from `empty-state/error-state.tsx` (mascot) |
| `apps/web-app/src/components/ui/route-state/not-found.tsx`           | create — moved from `empty-state/not-found.tsx` (mascot)   |
| `apps/web-app/src/components/ui/route-state/index.ts`                | create — barrel exporting `ErrorState`, `NotFound`         |
| `apps/web-app/src/routes/__root.tsx`                                 | edit — import path `empty-state` → `route-state`           |
| `apps/web-app/src/components/ui/empty-state/base.stories.tsx`        | create — Storybook matrix                                  |
| `apps/web-app/src/components/ui/error-state.stories.tsx`             | create — Storybook matrix                                  |
| `apps/web-app/src/components/ui/loading-state.stories.tsx`           | create — Storybook matrix                                  |
| `apps/web-app/src/components/ui/route-state/route-state.stories.tsx` | create — Storybook for mascot `ErrorState` + `NotFound`    |

~13 files, all tightly coupled and all part of one cohesive infrastructure change. The
user explicitly scoped this as a single Phase 1 unit (review checkpoint is the Storybook).
Migration of consumers is deferred to Phase 2.

## Context the new session needs

### What exists today (read these first)

- **`apps/web-app/src/components/ui/empty-state/base.tsx`** — `EmptyState` (full-panel
  only): `flex flex-col items-center justify-center py-16 text-center`, icon badge
  `size-16 rounded-full bg-muted`, optional image (mascot PNG `size-24`), title `text-lg`,
  description `text-sm max-w-md`, optional action. Props: `{ icon?, image?, title,
description?, action?, className?, ...HTMLAttributes }`.
- **`apps/web-app/src/components/ui/empty-state/index.ts`** — barrel re-exporting
  `EmptyState`, `NoData`, `ErrorState` (mascot), `NotFound` (mascot).
- **`apps/web-app/src/components/ui/empty-state/error-state.tsx`** — mascot `ErrorState`
  (image `/mascot/error.png?url`, title "Something went wrong"). **Collides in name** with
  the text `ErrorState` below.
- **`apps/web-app/src/components/ui/empty-state/not-found.tsx`** — mascot `NotFound`
  (image `/mascot/404.png?url`, title "Page not found").
- **`apps/web-app/src/components/ui/empty-state/no-data.tsx`** — mascot `NoData` (image
  `/mascot/404.png?url`, title "No data", default description "No items found").
- **`apps/web-app/src/components/ui/error-state.tsx`** — text `ErrorState`:
  `AlertCircle` + `text-destructive` title + message + optional retry `<Button>` with
  `RotateCcw`. Props: `{ title?="Error", message, onRetry? }`. Used by ~8 consumers
  (chat, terminal, files, desk nodes).
- **`apps/web-app/src/components/ui/loading-state.tsx`** — `LoadingState`: centered
  `Loader2 size-5 animate-spin` + title + optional message.
- **`apps/web-app/src/routes/__root.tsx:2`** — the **only** consumer of the mascot
  `ErrorState`/`NotFound` (used in `errorComponent`/`notFoundComponent` route options).

### Decisions already made (locked, do not revisit)

1. **Folder split**: mascot route-level states move to `ui/route-state/`; content-level
   text `ErrorState` stays at `ui/error-state.tsx`. Both keep the export name `ErrorState`
   — the import path disambiguates. This was chosen over renaming because the text
   `ErrorState` has ~8 consumers.
2. **`NoData` becomes icon-based**, dropping the mascot image. Default icon: `Inbox` from
   `lucide-react`. Pass-through `size` and other `EmptyState` props.
3. **`size` variant**: `type StateSize = "full" | "compact" | "inline"`, added to
   `EmptyState`, `ErrorState`, `LoadingState`. Default = `"full"` for backward
   compatibility (existing callers pass no `size` and keep their current look).
4. **`size="inline"` layout is row-based** (icon + title same row, no description, no
   badge). `full`/`compact` are column-based (current layout). This means the `inline`
   branch renders differently enough to warrant its own JSX branch inside each component.
5. **Route-state components do NOT get a `size` variant** — they are always full/route-level.
6. **Dead code is left in place**: `ui/empty.tsx` (unused shadcn primitives), `ui/loading-overlay.tsx`,
   `ui/loading-spinner.tsx` are not deleted in this plan.
7. **No consumer migration in Phase 1.** That is Phase 2.

### Conventions (from `apps/web-app/AGENTS.md`)

- Tailwind v4 via `@tailwindcss/vite` (no `tailwind.config.js`); theme tokens in
  `src/index.css`. Use `cn(...)` from `src/lib/utils.ts` for class merging; use `cva` for
  multi-variant components (see existing shadcn primitives like `button.tsx` for style).
- shadcn `components.json`: style `"base-vega"`, baseColor `"neutral"`, iconLibrary `lucide`.
- Icons: `lucide-react` only.
- ESM only; `import type` for type-only imports (`verbatimModuleSyntax` is on).
- No comments unless asked.
- Storybook 10 with `@storybook/tanstack-react` framework. Stories use `preview.meta(...)`
  / `meta.story(...)`, NOT classic `Meta`/`StoryObj`. Title is hierarchical slash-separated
  mirroring `src/` location (e.g. `UI/EmptyState`). See `apps/web-app/AGENTS.md` →
  "Storybook" section and existing stories like `src/components/ui/color-picker/ColorPicker.stories.tsx`
  for the exact pattern.
- Within `**/*.stories.*`, `eslint.config.js` relaxes `no-explicit-any` and
  `react-hooks/rules-of-hooks`.
- Run lint/typecheck/tests from the repo root or via `pnpm --filter web-app <cmd>`.

### Exact `size` → Tailwind class mapping (use these values)

```
size="full" (default):
  container:  py-16  (column)
  icon badge: size-16 rounded-full bg-muted text-muted-foreground
  icon glyph: size-8
  title:      text-lg font-semibold
  desc:       mt-1 max-w-md text-sm text-muted-foreground
  action:     mt-4

size="compact":
  container:  py-8   (column)
  icon badge: size-12 rounded-full bg-muted text-muted-foreground
  icon glyph: size-6
  title:      text-base font-semibold
  desc:       mt-1 max-w-xs text-sm text-muted-foreground
  action:     mt-3

size="inline":
  container:  py-2 px-2  (ROW — flex-row items-center justify-center gap-2)
  icon glyph: size-4 text-muted-foreground  (no badge, no bg)
  title:      text-sm text-muted-foreground  (NOT font-semibold; muted)
  desc:       NOT rendered (ignored even if passed)
  action:     NOT rendered (ignored even if passed)
```

For `ErrorState` and `LoadingState`, mirror the same padding/icon/title scale. `ErrorState`
keeps its `text-destructive` coloring on icon/title; the retry button only renders for
`full` and `compact` (not `inline`). `LoadingState` uses `Loader2 animate-spin` with the
same size scale as the icon glyph.

### Gotchas

- `EmptyState`'s `image` prop (mascot PNG) is used by route-state components via the base
  `EmptyState`. Keep the `image` rendering path in base.tsx intact — route-state still
  passes images. The `image` path is irrelevant for `compact`/`inline` but should not be
  forbidden (route-state always uses `full`).
- The current `EmptyState` extends `React.HTMLAttributes<HTMLDivElement>` and forwards
  `...props` to the container. Preserve this — callers spread `onClick` etc.
- `routes/__root.tsx` imports both `ErrorState` AND `NotFound` from the same path
  (`@/components/ui/empty-state`). After the move, change that single import line to
  `@/components/ui/route-state`. Grep confirms this is the only file importing the mascot
  variants: verify with
  `rg "from \"@/components/ui/empty-state\"" apps/web-app/src` after the move.
- `NoData` is consumed by `features/home/tabs/implementations/files/FilesContent.tsx` and
  `FileDetail.tsx` — these still work after changing NoData to icon-based, because the
  public props (`title`, `description`, `action`, `className`, `...props`) stay the same;
  only the default visual (image → icon) changes.

## Tasks

- [x] 1. **Create `ui/route-state/` and move the two mascot components**
  - Create `apps/web-app/src/components/ui/route-state/error-state.tsx` with the contents
    of `apps/web-app/src/components/ui/empty-state/error-state.tsx` (verbatim — imports
    `EmptyState` from `../empty-state/base.tsx`).
  - Create `apps/web-app/src/components/ui/route-state/not-found.tsx` with the contents
    of `apps/web-app/src/components/ui/empty-state/not-found.tsx` (same, fix the import
    path to `../empty-state/base.tsx`).
  - Create `apps/web-app/src/components/ui/route-state/index.ts` exporting `ErrorState`
    (from `./error-state.tsx`) and `NotFound` (from `./not-found.tsx`).
  - Delete `apps/web-app/src/components/ui/empty-state/error-state.tsx` and
    `apps/web-app/src/components/ui/empty-state/not-found.tsx`.
  - Edit `apps/web-app/src/components/ui/empty-state/index.ts` to remove the
    `ErrorState`/`NotFound` lines (keep `EmptyState`, `NoData`).
  - verify: `pnpm --filter web-app check-types` — if any consumer still imports the
    mascot variants from `empty-state`, this will fail and surface it.
  - files: `apps/web-app/src/components/ui/route-state/error-state.tsx`,
    `apps/web-app/src/components/ui/route-state/not-found.tsx`,
    `apps/web-app/src/components/ui/route-state/index.ts`,
    `apps/web-app/src/components/ui/empty-state/error-state.tsx` (delete),
    `apps/web-app/src/components/ui/empty-state/not-found.tsx` (delete),
    `apps/web-app/src/components/ui/empty-state/index.ts`

- [x] 2. **Fix the only consumer of the mascot variants**
  - In `apps/web-app/src/routes/__root.tsx:2`, change
    `import { ErrorState, NotFound } from "@/components/ui/empty-state"` to
    `import { ErrorState, NotFound } from "@/components/ui/route-state"`.
  - verify: `rg "from \"@/components/ui/empty-state\"" apps/web-app/src/routes` returns
    no mascot imports; `pnpm --filter web-app check-types` clean.
  - files: `apps/web-app/src/routes/__root.tsx`

- [x] 3. **Add `size` variant to `EmptyState`**
  - In `apps/web-app/src/components/ui/empty-state/base.tsx`: add `size?: StateSize` prop
    (default `"full"`). Use the exact Tailwind classes from the mapping in Context.
    Branch the render: `size === "inline"` → row layout (icon glyph `size-4` + title
    `text-sm text-muted-foreground`, no description, no action, no badge); `full`/`compact`
    → column layout with the per-size badge/icon/title classes. Define `StateSize` inline
    in this file (`type StateSize = "full" | "compact" | "inline"`) and re-export it.
  - Keep the `image` rendering path intact (route-state still uses it with `full`).
  - verify: `pnpm --filter web-app check-types`; open the file and confirm
    `size="inline"` branch does not render description/action.
  - files: `apps/web-app/src/components/ui/empty-state/base.tsx`

- [x] 4. **Add `size` variant to `ErrorState` (text) and `LoadingState`**
  - In `apps/web-app/src/components/ui/error-state.tsx`: import `type { StateSize }` from
    `./empty-state/base.tsx`, add `size?: StateSize` (default `"full"`). Apply the same
    padding/icon/title scale. The retry `<Button>` renders only for `size !== "inline"`.
    Keep `text-destructive` on icon + title for all sizes.
  - In `apps/web-app/src/components/ui/loading-state.tsx`: same — add `size?: StateSize`
    imported from `./empty-state/base.tsx`. `Loader2` glyph size scales per variant
    (`size-5` full / `size-4` compact / `size-3.5` inline). Message renders only for
    `size !== "inline"`.
  - verify: `pnpm --filter web-app check-types`.
  - files: `apps/web-app/src/components/ui/error-state.tsx`,
    `apps/web-app/src/components/ui/loading-state.tsx`

- [x] 5. **Convert `NoData` to icon-based**
  - In `apps/web-app/src/components/ui/empty-state/no-data.tsx`: replace `image={...mascot}`
    with `icon={Inbox}` (import `Inbox` from `lucide-react`). Keep `title="No data"` and
    default `description="No items found"`. Pass through `size` and other props to
    `EmptyState` so callers can pick a size. Remove the mascot image import.
  - verify: file no longer imports `/mascot/404.png?url`; `pnpm --filter web-app check-types`.
  - files: `apps/web-app/src/components/ui/empty-state/no-data.tsx`

- [x] 6. **Write Storybook story for `EmptyState`**
  - Create `apps/web-app/src/components/ui/empty-state/base.stories.tsx`. Use
    `preview.meta({...})` + `meta.story({...})` pattern (see
    `src/components/ui/color-picker/ColorPicker.stories.tsx` for the exact API).
    Title: `UI/EmptyState`.
  - Stories (one named export per visual state):
    - `FullDefault` — `size="full"`, icon `Inbox`, title, description, action button.
    - `FullNoIcon` — `size="full"`, title only.
    - `Compact` — `size="compact"`, icon, title, description.
    - `Inline` — `size="inline"`, icon `Inbox`, title "No items".
    - `InlineNoIcon` — `size="inline"`, title only.
    - `WithImage` — `size="full"`, `image` (use any mascot PNG path) to confirm the image
      path still renders (route-state depends on it).
  - Wrap in a `<div className="w-96 border rounded">` per story so the centered layout is
    visible.
  - verify: `pnpm --filter web-app storybook` boots without errors; the `UI/EmptyState`
    story group shows all 6 stories.
  - files: `apps/web-app/src/components/ui/empty-state/base.stories.tsx`

- [x] 7. **Write Storybook stories for `ErrorState` and `LoadingState`**
  - Create `apps/web-app/src/components/ui/error-state.stories.tsx`. Title: `UI/ErrorState`.
    Stories:
    - `Full` — `size="full"`, message, `onRetry`.
    - `FullNoRetry` — `size="full"`, message, no `onRetry`.
    - `Compact` — `size="compact"`, message, `onRetry`.
    - `Inline` — `size="inline"`, message (no retry rendered).
    - `LongMessage` — `size="full"` with a multi-sentence message.
  - Create `apps/web-app/src/components/ui/loading-state.stories.tsx`. Title: `UI/LoadingState`.
    Stories:
    - `Full` — `size="full"`, title + message.
    - `FullNoMessage` — `size="full"`, default title, no message.
    - `Compact` — `size="compact"`, message.
    - `Inline` — `size="inline"`.
  - verify: `pnpm --filter web-app storybook` shows both new groups; all stories render.
  - files: `apps/web-app/src/components/ui/error-state.stories.tsx`,
    `apps/web-app/src/components/ui/loading-state.stories.tsx`

- [x] 8. **Write Storybook story for `route-state` (mascot)**
  - Create `apps/web-app/src/components/ui/route-state/route-state.stories.tsx`. Title:
    `UI/RouteState`. Stories:
    - `ErrorState` — `<ErrorState />` (defaults) inside a `min-h-96 bg-muted/40` wrapper.
    - `ErrorStateWithAction` — `<ErrorState action={<Button>Go home</Button>} />`.
    - `NotFound` — `<NotFound />`.
    - `NotFoundWithAction` — `<NotFound action={<Button>Go home</Button>} />`.
  - verify: `pnpm --filter web-app storybook` shows `UI/RouteState` group; mascot images
    load.
  - files: `apps/web-app/src/components/ui/route-state/route-state.stories.tsx`

- [x] 9. **Full verification**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types` all green;
    `pnpm --filter web-app exec vitest run` passes (no behavior change expected —
    existing tests should be unaffected since no consumer was edited).
  - files: —

## Done when

- [x] `rg "ErrorState" apps/web-app/src --glob "*.tsx" -l` shows the two `ErrorState`
      exports live in clearly different folders (`ui/error-state.tsx` for text,
      `ui/route-state/error-state.tsx` for mascot), and importing the wrong one requires a
      different import path.
- [x] `apps/web-app/src/components/ui/empty-state/index.ts` exports only `EmptyState`,
      `NoData` (no mascot `ErrorState`/`NotFound`).
- [x] `EmptyState`, `ErrorState` (text), `LoadingState` all accept `size?: "full" |
    "compact" | "inline"` and default to `"full"`.
- [x] `size="inline"` renders row-layout (icon + title same row, no description, no action);
      `full`/`compact` render the existing column layout.
- [x] `NoData` renders with `Inbox` icon, no mascot image.
- [x] `pnpm --filter web-app storybook` opens with three new groups — `UI/EmptyState`,
      `UI/ErrorState`, `UI/LoadingState`, `UI/RouteState` — and every size/variant is
      visible for review.
- [x] `pnpm --filter web-app lint && pnpm --filter web-app check-types` clean.
- [x] `pnpm --filter web-app exec vitest run` passes (no consumer touched, no behavior
      change).
- [ ] **Review checkpoint**: the user opens Storybook and approves the variant design before
      Phase 2 (consumer migration) is planned.

## Implementation notes

- **Route-state story uses `EmptyState` directly** (not the `route-state` components). The
  `route-state` components import mascot PNGs via Vite's `?url` suffix
  (`import url from "/mascot/error.png?url"`); under Storybook, MSW + the static-file
  middleware serve the raw PNG bytes for that URL **before** Vite's transform pipeline
  runs, so the browser tries to parse PNG bytes as a JS module and fails. Rendering
  `EmptyState` with a plain string URL (`image="/mascot/error.png"`) avoids the `?url`
  transform entirely and is visually identical (the route-state components are thin
  wrappers over `EmptyState` with the same image/title/description). If a future Phase
  wants the story to exercise the actual `route-state` components, the fix belongs in
  `.storybook/preview.tsx` (configure MSW to bypass `/mascot/*` or similar) — out of scope
  for Phase 1.
- **`ErrorState`/`LoadingState` "full" preserved their existing look** (py-8 px-4, size-5
  glyph, font-medium title) rather than adopting EmptyState's `full` scale (py-16, size-8,
  text-lg). Decision #3 ("default = full for backward compatibility, existing callers keep
  their current look") was treated as the hard requirement; the size-mapping table in
  Context describes EmptyState-specific values. The Task 4 note pinning LoadingState's
  glyph to `size-5`/`size-4`/`size-3.5` was honored. Compact scales padding and title down
  proportionally; inline uses the row layout with `size-3.5` glyph and muted title.

## Notes for implementer

- This plan deliberately touches ~13 files but is one cohesive infrastructure change. The
  user defined the Phase 1/Phase 2 split themselves; do not bundle consumer migration into
  this plan even if it looks tempting — Phase 2 is a separate plan that depends on the
  Storybook review.
- After Task 1 (the move), the `EmptyState` base file is imported by `route-state/*` via a
  relative path (`../empty-state/base.tsx`). Keep that import working — don't move
  `base.tsx`.
- Use `cva` from `class-variance-authority` for the size → class mapping if it reads
  cleanly; inline conditional `cn(...)` calls are also fine (match the style of the
  surrounding shadcn primitives — check `button.tsx` for the house pattern). Either way,
  the exact Tailwind classes per size are pinned in the Context section above; do not
  invent new spacing values.
- For Storybook stories, use `as any` on any prop that's awkward to type in a story (e.g.
  passing a mock `onRetry`) — `eslint.config.js` relaxes `no-explicit-any` inside
  `**/*.stories.*`.
- Do NOT delete `ui/empty.tsx`, `ui/loading-overlay.tsx`, or `ui/loading-spinner.tsx` —
  the user chose to keep dead code for now.
- Do NOT add `size` to the route-state (mascot) components — they're route-level only.
- Commit choreography suggestion (do not commit unless asked): Task 1+2 as one commit
  ("move route-state components to their own folder"), Task 3+4+5 as one commit ("add size
  variant to state components"), Task 6+7+8 as one commit ("add Storybook stories for state
  components").
