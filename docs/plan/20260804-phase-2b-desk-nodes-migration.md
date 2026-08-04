---
title: "Phase 2B: Migrate desk-node state JSX to shared components"
slug: phase-2b-desk-nodes-migration
id: 20260804-phase-2b-desk-nodes-migration
status: ready
created: 2026-08-04
source: planning session 2026-08-04 (Phase 1 review)
---

# Plan: Phase 2B — Migrate desk-node state JSX to shared components

## Why

Two of the desk canvas's React Flow node implementations hand-roll inline state JSX
inside their node bodies. `MermaidNode` has four states (rendering, success, error,
empty-with-code-prompt) plus a destructive error footer inside its code Popover;
`TodoNode` has a centered "No tasks yet" fallback. After Phase 2A extends the shared
`ErrorState`/`LoadingState` with compact/inline support, these node bodies can adopt the
shared components for consistency with the rest of the app. The node chrome
(`WindowFrame`) is unchanged — only the in-body state JSX is migrated.

## Target file

| Path                                                                                | Action                                                                                     |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `apps/web-app/src/features/desk/nodes/implementations/mermaid-node/MermaidNode.tsx` | edit — replace inline state JSX at lines 130-153 (and decide on popover footer at 130-134) |
| `apps/web-app/src/features/desk/nodes/implementations/todo-node/TodoNode.tsx`       | edit — replace "No tasks yet" fallback at lines 125-129                                    |

Two files, both tightly coupled to the desk node registry but independent of each other.

## Context the new session needs

### What exists today (read these first)

- **Phase 2A must be complete first** — read
  `docs/plan/20260804-phase-2a-shared-props-and-dropdown-sidebar-migration.md`. It extends
  `LoadingState` with `title?: string | null` (silent mode), `spinner?: ReactNode | false`,
  and `className?`. This plan relies on all three.
- **`apps/web-app/src/components/ui/empty-state/base.tsx`** (79 lines) — `EmptyState`
  supports `{ icon?, image?, title, description?, action?, size?, className?, ...props }`.
  For node bodies, use `size="compact"` (py-8, text-base title) or `size="inline"` (py-2,
  row layout, text-sm muted). For a single muted line in a small node, prefer `inline`.
- **`apps/web-app/src/components/ui/loading-state.tsx`** (post-2A) — `LoadingState` accepts
  `title={null}` (silent), `spinner={false}` (text only), and `className`. For node
  bodies, the "Rendering..." case becomes `<LoadingState size="inline" title="Rendering..."
spinner={false} />`.
- **`apps/web-app/src/components/ui/error-state.tsx`** (post-2A) — `ErrorState` accepts
  `bare` (text-only destructive message) and `className`. For node bodies, the "Fix errors
  to see diagram" case becomes `<ErrorState size="inline" bare message="Fix errors to see
diagram" />`.
- **`apps/web-app/src/features/desk/nodes/implementations/mermaid-node/MermaidNode.tsx:130-153`**
  — inside `<WindowFrame>`, a `<div className="h-full w-full flex items-center justify-center
overflow-auto p-4 bg-muted/30">` wraps a 4-way ternary:
  - `isGenerating && code.trim()`: `<div className="text-sm text-muted-foreground">Rendering...</div>`
  - `svg`: renders the diagram (no migration)
  - `error`: `<div className="text-sm text-destructive">Fix errors to see diagram</div>`
  - else (empty): `<div className="text-sm text-muted-foreground">Click <Code className="inline h-4 w-4" /> to add mermaid code</div>`
- **`apps/web-app/src/features/desk/nodes/implementations/mermaid-node/MermaidNode.tsx:130-134`**
  — INSIDE the code `PopoverContent`, a destructive footer: `<div className="px-3 py-2
text-xs text-destructive border-t bg-destructive/10">{error}</div>`. This is a popover
  footer, not a state panel — **leave it as-is** (migrating would change its tight
  `text-xs` look). See "Decisions already made" below.
- **`apps/web-app/src/features/desk/nodes/implementations/todo-node/TodoNode.tsx:125-129`**
  — inside the node body's scroll area: `{items.length === 0 && (<p className="py-4
text-center text-sm text-muted-foreground">No tasks yet</p>)}`.

### Decisions already made (locked, do not revisit)

1. **`MermaidNode` "Click <Code /> to add mermaid code" empty state stays inline JSX.** The
   title contains an embedded `<Code />` icon inline with the text, which `EmptyState`'s
   string-only `title` prop does not support. Extending `EmptyState` to accept
   `ReactNode` titles is out of scope (would touch every story and consumer). Skip this
   branch — migrate only the "Rendering..." and "Fix errors..." branches.
2. **`MermaidNode` Popover error footer stays inline JSX.** It is a `text-xs` border-top
   footer inside a `PopoverContent`, not a state panel. Migrating it to `ErrorState` would
   change its visual significantly. Leave it.
3. **`TodoNode` empty state migrates to `<EmptyState size="inline" title="No tasks yet" />`.**
   The `inline` row layout fits a small node body; the current `<p className="py-4
text-center text-sm text-muted-foreground">` becomes a row-centered `text-sm muted`
   block. Visual change is minimal.
4. **Use `size="inline"` (not `compact`) for both node bodies.** Desk nodes are small
   (default 200x200 / 300x200); `compact`'s `py-8` plus `text-base font-semibold` title is
   too tall and heavy for a node. `inline`'s `py-2 text-sm muted` matches the current text
   density.

### Conventions (from `apps/web-app/AGENTS.md`)

- Tailwind v4, `cn(...)` from `src/lib/utils.ts`.
- Icons from `lucide-react` only.
- ESM only; `import type` for type-only imports.
- No comments unless asked.
- The desk node registry lives in `src/features/desk/nodes/template/index.ts` — node
  components are React Flow `NodeProps`. Don't change node registration in this plan; only
  edit the in-body JSX.

### Gotchas

- `MermaidNode` already imports `Code` and `X` from `lucide-react`. After migration, `Code`
  is still used (in the popover trigger button and the "Click <Code /> to add..." empty
  branch). Do not remove `Code` from the import.
- `MermaidNode`'s 4-way ternary currently chains `isGenerating && code.trim() ? ... : svg
? ... : error ? ... : <empty>`. After migration, only the first and third branches
  change — keep the success and empty branches untouched.
- `TodoNode` is wrapped in `<WindowFrame>` with `minHeight={200}`; the empty state must
  not force a taller min height. `EmptyState size="inline"` has `py-2` — fine.

## Tasks

- [ ] 1. **Migrate `MermaidNode` body states**
  - Add `import { LoadingState } from "@/components/ui/loading-state"` and
    `import { ErrorState } from "@/components/ui/error-state"` at the top of
    `MermaidNode.tsx`.
  - In the 4-way ternary at lines 140-154: replace the `isGenerating && code.trim()` branch
    (`<div className="text-sm text-muted-foreground">Rendering...</div>`) with
    `<LoadingState size="inline" title="Rendering..." spinner={false} />`. Replace the
    `error` branch (`<div className="text-sm text-destructive">Fix errors to see
diagram</div>`) with `<ErrorState size="inline" bare message="Fix errors to see
diagram" />`. Leave the `svg` and empty branches unchanged.
  - verify: `pnpm --filter web-app check-types` clean. Open the file and confirm the
    Popover footer (lines ~130-134) is unchanged and still uses raw `<div>` JSX.
  - files: `apps/web-app/src/features/desk/nodes/implementations/mermaid-node/MermaidNode.tsx`

- [ ] 2. **Migrate `TodoNode` empty state**
  - Add `import { EmptyState } from "@/components/ui/empty-state"` at the top of
    `TodoNode.tsx`.
  - Replace lines 125-129 (`{items.length === 0 && (<p className="py-4 text-center
text-sm text-muted-foreground">No tasks yet</p>)}`) with
    `{items.length === 0 && <EmptyState size="inline" title="No tasks yet" />}`.
  - verify: `pnpm --filter web-app check-types` clean.
  - files: `apps/web-app/src/features/desk/nodes/implementations/todo-node/TodoNode.tsx`

- [ ] 3. **Full verification**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types` all green;
    `pnpm --filter web-app exec vitest run` passes.
  - files: —

## Done when

- [ ] `MermaidNode` body uses `<LoadingState>` for "Rendering..." and `<ErrorState>` for
      "Fix errors to see diagram"; the success (svg), empty ("Click <Code /> to add..."),
      and Popover error footer branches are unchanged.
- [ ] `TodoNode` body uses `<EmptyState size="inline" title="No tasks yet" />` instead of
      a hand-rolled `<p>`.
- [ ] `rg "text-sm text-muted-foreground\">Rendering|text-sm text-destructive\">Fix errors|text-sm text-muted-foreground\">No tasks yet"
    apps/web-app/src/features/desk/nodes` returns no matches.
- [ ] `pnpm --filter web-app lint && pnpm --filter web-app check-types` clean.
- [ ] `pnpm --filter web-app exec vitest run` passes.

## Notes for implementer

- **Depends on Phase 2A.** Read `docs/plan/20260804-phase-2a-shared-props-and-dropdown-sidebar-migration.md`
  first and confirm 2A is merged (the new `ErrorState.bare`, `LoadingState.spinner`,
  `LoadingState.title={null}` props must exist).
- Do not touch `WindowFrame`, the node registry (`template/index.ts`), or any other node
  implementation. This plan is scoped to exactly two files.
- Do not extend `EmptyState` to accept `ReactNode` titles just for the "Click <Code /> to
  add..." case — that's scope creep. Leave that branch inline.
- If a node body looks visually different after migration (e.g., extra padding), prefer
  adjusting the wrapping `<div className="h-full w-full flex items-center justify-center
...">` rather than adding new size variants to the shared components.
