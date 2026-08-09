---
title: Add Stopwatch desk node for timing
slug: add-stopwatch-desk-node
id: 20260809-add-stopwatch-desk-node
status: ready
created: 2026-08-09
source: planning session 2026-08-09
---

# Plan: Add Stopwatch desk node for timing

## Why

The Desk canvas (`apps/web-app/src/features/desk/`) has no node for timing work.
We want a self-contained stopwatch node that a user can drag onto the canvas,
start/pause/reset, and have the elapsed time survive a page reload while running.
This fills a gap in the "desktop IDE" surface — timing tasks alongside chat,
todo, and notes.

## Target file

| Path                                                                                    | Action                       |
| --------------------------------------------------------------------------------------- | ---------------------------- |
| `apps/web-app/src/features/desk/nodes/implementations/stopwatch-node/meta.ts`           | create                       |
| `apps/web-app/src/features/desk/nodes/implementations/stopwatch-node/StopwatchNode.tsx` | create                       |
| `apps/web-app/src/features/desk/nodes/implementations/stopwatch-node/index.ts`          | create                       |
| `apps/web-app/src/features/desk/nodes/template/index.ts`                                | edit — register the template |

Four files, but three are new siblings under one new folder + one registry edit.
Single-feature scope.

## Context the new session needs

- **Authoritative scaffold guide:** `.agents/skills/scaffold-cloudy-desk-node/SKILL.md`
  is the canonical recipe for adding any desk node. Read it first — it documents the
  `meta.ts` / `<Name>Node.tsx` / `index.ts` triplet and the registry wiring.
- **Best in-repo reference for a stateful + `defaultData` node is `todo-node`:**
  - `apps/web-app/src/features/desk/nodes/implementations/todo-node/TodoNode.tsx:20` —
    shows `useReactFlow().updateNodeData(id, { ... })` for mutating node `data`.
  - `apps/web-app/src/features/desk/nodes/implementations/todo-node/meta.ts:5` —
    shows the `defaultData` field on `NodeTemplate`.
  - `apps/web-app/src/features/desk/nodes/implementations/todo-node/index.ts` —
    the barrel pattern to copy verbatim (swap names).
- **`WindowFrame`** lives at
  `apps/web-app/src/features/desk/nodes/implementations/WindowFrame.tsx:35`. It renders
  the always-visible title bar + close button + resize handles, and already wraps
  children with `nodrag nopan nowheel` (line 108) — so interactive elements inside need
  no extra classes. Pick `WindowFrame` (not `FramelessNode`) because a stopwatch is
  app-like, not content-only.
- **`NodeTemplate` interface:**
  `apps/web-app/src/features/desk/nodes/template/nodeTemplates.ts:7`. Fields: `id`,
  `label`, `icon` (a `lucide-react` component ref), `size?`, `defaultData?`,
  `configDialog?`, `component`.
- **Registry:** `apps/web-app/src/features/desk/nodes/template/index.ts:12`. Add one
  import line + append `stopwatchNodeTemplate,` to the `nodeTemplates` array. That is
  the _only_ wiring — from `nodeTemplates` the canvas derives `nodeTypes` (line 22) and
  the sidebar list automatically.
- **Keep the four coupled names in sync** (folder / `meta.id` / `Node<..., "id">` generic
  literal / `component`): all derived from `name = "stopwatch"`. `<Name>` = `Stopwatch`,
  `<camelName>` = `stopwatch`. See the table in the scaffold skill's Step 1.
- **Persistence is free** — `apps/web-app/src/stores/flowStore.ts:37` persists node
  `data` to `localStorage` under `"flow-storage"`. Storing `startedAt` as an epoch-ms
  timestamp means a running timer reconstructs itself on reload with no special code:
  `elapsed = accumulatedMs + (Date.now() - startedAt)`. **Do NOT** call
  `updateNodeData` on every tick — that spams localStorage. Only write on
  start/pause/reset transitions; keep the live display in local React state.
- **Icon choice:** `lucide-react` exports `Timer` (and alias `TimerIcon`). Use `Timer`.
- **Conventions** (from `apps/web-app/AGENTS.md` and root `AGENTS.md`): TypeScript
  strict, ESM-only, `import type` for type-only imports, no comments unless asked,
  `cn(...)` from `@/lib/utils` for conditional classes, use design tokens from
  `DESIGN.md` (`text-foreground`, `bg-background`, `text-muted-foreground`, …) — never
  hardcode colors. Use `Button` from `@/components/ui/button` (it has `size="xs"`/`"sm"`
  used by `TodoNode.tsx`).

### Decisions already made (do not relitigate)

- **Features: Start / Pause / Reset only — no laps.** (User explicitly chose the basic
  scope.) Data shape therefore has no `laps` field. If laps are wanted later, that's a
  follow-up plan.
- **Reload behavior: keep running.** Timer continues across page reload by virtue of the
  `startedAt` timestamp. (User explicitly chose this.)
- **Frame: `WindowFrame`.**
- **Init strategy: `defaultData`** with
  `{ accumulatedMs: 0, running: false, startedAt: null }`.

### Data shape

```ts
type StopwatchData = {
  accumulatedMs: number; // base time accumulated before the current run
  running: boolean; // is the timer currently running?
  startedAt: number | null; // epoch ms when the current run started; null when stopped
};
type StopwatchNodeProps = Node<StopwatchData, "stopwatch">;
```

### Transition logic (the core of the implementation)

- **Start** (from stopped): `updateNodeData(id, { running: true, startedAt: Date.now() })`
- **Pause** (from running):
  `updateNodeData(id, { running: false, accumulatedMs: accumulatedMs + (Date.now() - startedAt), startedAt: null })`
- **Reset:** `updateNodeData(id, { running: false, accumulatedMs: 0, startedAt: null })`
- **Displayed elapsed (computed each render):**
  `running ? accumulatedMs + (now - startedAt) : accumulatedMs`, where `now` is a local
  `useState` ticked by a `setInterval(50ms)` that is mounted only while `running`.
- **On mount, if `running && startedAt != null`**, start the interval immediately — the
  elapsed formula already accounts for the wall-clock gap, so the display continues
  seamlessly after a reload (no jump).

### Display format

Format ms as `MM:SS.cs` (centiseconds) when under one hour, `H:MM:SS.cs` when ≥ 1 hour.
A small inline helper function is fine (no need for a separate file). `cs` = 2-digit
centiseconds = `Math.floor((ms % 1000) / 10)`.

## Tasks

- [x] 1. Create the `stopwatch-node/` folder with `meta.ts`, `StopwatchNode.tsx`
     (full implementation, not a placeholder), and `index.ts`
  - verify: `pnpm --filter web-app check-types` passes; the new files exist under
    `apps/web-app/src/features/desk/nodes/implementations/stopwatch-node/`
  - files: `apps/web-app/src/features/desk/nodes/implementations/stopwatch-node/meta.ts`,
    `apps/web-app/src/features/desk/nodes/implementations/stopwatch-node/StopwatchNode.tsx`,
    `apps/web-app/src/features/desk/nodes/implementations/stopwatch-node/index.ts`
- [x] 2. Register the template in `template/index.ts` (one import + one array entry)
  - verify: `pnpm --filter web-app check-types && pnpm --filter web-app lint` both pass
  - files: `apps/web-app/src/features/desk/nodes/template/index.ts`
- [ ] 3. Manual behavior check in `pnpm run dev`
  - verify: drag a Stopwatch node from the sidebar onto a desk canvas; pressing Start
    increments the display; Pause freezes it; Reset zeroes it; with the timer running,
    reload the page and confirm the timer continues from the correct elapsed time
    (no jump backward or forward)
  - files: —

Order rationale: after task 1 the repo compiles but the node isn't visible yet (working
state). After task 2 it's wired in. Task 3 is the human-in-the-loop confirmation of the
persistence-across-reload behavior that can't be asserted by a shell command.

## Done when

- [x] A "Stopwatch" entry with a `Timer` icon appears in the Desk node sidebar
- [x] Dropping it creates a node whose Start button begins incrementing a `MM:SS.cs`
      (or `H:MM:SS.cs` past one hour) display
- [x] Pause freezes the display; Reset returns it to `00:00.00` and clears `running`/
      `startedAt`/`accumulatedMs`
- [ ] With the timer running, reloading the page leaves the timer running and showing the
      correct elapsed time (wall-clock gap is accounted for)
- [x] `pnpm --filter web-app check-types && pnpm --filter web-app lint` are clean

## Notes for implementer

- Do not call `updateNodeData` on every animation frame / interval tick — only on
  start/pause/reset. The live display must be driven by local React state so localStorage
  isn't written 20×/second. This is the single most important implementation rule.
- Read `TodoNode.tsx` before writing — it's the closest analogue (stateful node, uses
  `updateNodeData`, `WindowFrame`, shadcn `Button`). Mirror its structure and import style.
- No comments unless asked. No `.bak` files — git covers rollback.
- Do not add a `configDialog` (this node uses `defaultData`, not `dialog`). Do not add a
  `laps` feature — out of scope; open a follow-up plan if requested.
- Run `pnpm --filter web-app check-types && pnpm --filter web-app lint` before declaring
  done. If `check-types` fails it is almost always a wrong `lucide-react` export name or a
  `Node<..., "stopwatch">` literal that drifted from the folder name.
