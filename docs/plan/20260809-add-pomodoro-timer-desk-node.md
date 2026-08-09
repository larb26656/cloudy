---
title: Add Pomodoro Timer desk node
slug: add-pomodoro-timer-desk-node
id: 20260809-add-pomodoro-timer-desk-node
status: ready
created: 2026-08-09
source: planning session 2026-08-09
---

# Plan: Add Pomodoro Timer desk node

## Why

The Desk canvas (`apps/web-app/src/features/desk/`) has no node for the pomodoro
technique (work/break cycle). We want a self-contained timer node that a user can
drag onto the canvas, configure durations inline, run a work → short-break → work →
… cycle with auto-advance, hear a beep at each phase end, and have the timer
continue across page reloads while running. This adds time-management alongside
the existing stopwatch, chat, todo, and notes nodes.

## Target file

| Path                                                                                      | Action                       |
| ----------------------------------------------------------------------------------------- | ---------------------------- |
| `apps/web-app/src/features/desk/nodes/implementations/pomodoro-node/types.ts`             | create                       |
| `apps/web-app/src/features/desk/nodes/implementations/pomodoro-node/audio.ts`             | create                       |
| `apps/web-app/src/features/desk/nodes/implementations/pomodoro-node/usePomodoroEngine.ts` | create                       |
| `apps/web-app/src/features/desk/nodes/implementations/pomodoro-node/PomodoroNode.tsx`     | create                       |
| `apps/web-app/src/features/desk/nodes/implementations/pomodoro-node/meta.ts`              | create                       |
| `apps/web-app/src/features/desk/nodes/implementations/pomodoro-node/index.ts`             | create                       |
| `apps/web-app/src/features/desk/nodes/template/index.ts`                                  | edit — register the template |

Six new files in one new folder + one registry edit. Single-feature scope. Split into
multiple files because the catch-up engine logic is more complex than `todo`/`sticky`
(which fit in one file each); keeping it modular makes the engine testable in isolation
later.

## Context the new session needs

- **Authoritative scaffold guide:** `.agents/skills/scaffold-cloudy-desk-node/SKILL.md`
  is the canonical recipe for adding any desk node. Read it first — it documents the
  `meta.ts` / `<Name>Node.tsx` / `index.ts` triplet and the registry wiring.
- **Closest in-repo reference: stopwatch plan** at
  `docs/plan/20260809-add-stopwatch-desk-node.md`. It is the same shape (timestamp-based
  timer that survives reload). If the stopwatch node has already been implemented, read
  its files too — they are the best template for the engine pattern. If not, fall back to
  `todo-node`:
  - `apps/web-app/src/features/desk/nodes/implementations/todo-node/TodoNode.tsx:20` —
    `useReactFlow().updateNodeData(id, { ... })` for mutating node `data`.
  - `apps/web-app/src/features/desk/nodes/implementations/todo-node/meta.ts:5` —
    the `defaultData` field on `NodeTemplate`.
  - `apps/web-app/src/features/desk/nodes/implementations/sticky-note/StickyNoteNode.tsx:29`
    — shows `WindowFrame` usage with a `headerAction` (we use it for the settings gear).
- **`WindowFrame`** lives at
  `apps/web-app/src/features/desk/nodes/implementations/WindowFrame.tsx:35`. It renders
  the always-visible title bar + close button + resize handles, and already wraps
  children with `nodrag nopan nowheel` (line 108) — so interactive elements inside need
  no extra classes. Pick `WindowFrame` (not `FramelessNode`) because a timer is app-like.
  Supports `headerAction?: React.ReactNode` (line 27) for the settings-gear popover, and
  `color?: string` (line 25) for phase tinting.
- **`NodeTemplate` interface:**
  `apps/web-app/src/features/desk/nodes/template/nodeTemplates.ts:7`. Fields: `id`,
  `label`, `icon` (a `lucide-react` component ref), `size?`, `defaultData?`,
  `configDialog?`, `component`.
- **Registry:** `apps/web-app/src/features/desk/nodes/template/index.ts:12`. Add one
  import line + append `pomodoroNodeTemplate,` to the `nodeTemplates` array. That is
  the _only_ wiring — from `nodeTemplates` the canvas derives `nodeTypes` (line 22) and
  the sidebar list automatically.
- **Keep the coupled names in sync** (folder / `meta.id` / `Node<..., "id">` generic
  literal / `component`): all derived from `name = "pomodoro"`. `<Name>` = `Pomodoro`,
  `<camelName>` = `pomodoro`. See the table in the scaffold skill's Step 1.
- **Persistence is free** — `apps/web-app/src/stores/flowStore.ts` persists node `data`
  to `localStorage` under `"flow-storage"`. Storing `endsAt` as an epoch-ms timestamp
  means the timer reconstructs itself on reload with no special code: a phase ends the
  moment `Date.now() >= endsAt`, regardless of whether the node was mounted. **Do NOT**
  call `updateNodeData` on every tick — that spams localStorage. Only write on
  start/pause/skip/reset/settings-change/phase-transition; keep the live display in
  local React state refreshed by `setInterval(250ms)`.
- **Icon choice:** use `Tomato` from `lucide-react` (the iconic pomodoro symbol). If
  typecheck fails with that name, fall back to `AlarmClock` then `Hourglass`. Do NOT use
  `Timer` — that is taken by the stopwatch node and would visually clash.
- **Conventions** (from `apps/web-app/AGENTS.md` and root `AGENTS.md`): TypeScript
  strict, ESM-only, `import type` for type-only imports, no comments unless asked,
  `cn(...)` from `@/lib/utils` for conditional classes, use design tokens from
  `DESIGN.md` (`text-foreground`, `bg-background`, `text-muted-foreground`, …) — never
  hardcode colors. Use `Button` from `@/components/ui/button` (it has `size="xs"`/`"sm"`
  used by `TodoNode.tsx`); `Input` from `@/components/ui/input`; `Popover` /
  `PopoverContent` / `PopoverTrigger` from `@/components/ui/popover` (sticky-note uses
  these for its color picker — copy that pattern for the settings gear).

### Decisions already made (do not relitigate)

- **Background ticking: yes — catch up across remounts.** Store `endsAt` (epoch ms) and
  derive remaining time from `Date.now()`. On mount / on each tick, if
  `Date.now() >= endsAt` while `status === "running"`, process one phase transition
  (beep + advance + set new `endsAt`). To avoid silently burning through dozens of
  pomodoros during a long absence, process **at most one** transition per tick cycle —
  the next tick handles the next one. A `visibilitychange` + `window focus` listener
  triggers an immediate tick when the tab regains focus.
- **Configurable in-node, not fixed classic.** `data.settings` holds all four durations;
  a settings Popover (gear icon in header) edits them. Changes apply immediately when
  idle/paused; the gear is disabled while `running` (with a `title` tooltip
  "Pause to change settings") because changing duration mid-phase is ambiguous.
- **Phase-end signal: beep only** (Web Audio API oscillator — no asset file needed, no
  `Notification` permission flow). Two tones for distinctness:
  - work → break: 2 beeps at 660 Hz (lower, "stand down")
  - break → work: 3 beeps at 880 Hz (higher, "back to it")
- **Auto-advance phases** — when one phase ends the next begins immediately (standard
  pomodoro flow). The user can pause/skip if they don't want the next phase.
- **Frame: `WindowFrame`.**
- **Init strategy: `defaultData`** with the classic 25/5/15/4 settings and idle state.

### Data shape (`types.ts`)

```ts
export type PomodoroPhase = "work" | "short-break" | "long-break";
export type PomodoroStatus = "idle" | "running" | "paused";

export type PomodoroSettings = {
  workMinutes: number; // default 25, min 1
  shortBreakMinutes: number; // default 5, min 1
  longBreakMinutes: number; // default 15, min 1
  sessionsBeforeLongBreak: number; // default 4, min 1
};

export type PomodoroNodeData = {
  settings: PomodoroSettings;
  phase: PomodoroPhase;
  status: PomodoroStatus;
  endsAt: number | null; // epoch ms — used only when status === "running"
  remainingMs: number | null; // used only when status === "paused"
  completedWorkSessions: number;
};

export type PomodoroNodeProps = Node<PomodoroNodeData, "pomodoro">;
```

### Audio helper (`audio.ts`)

Module-level lazy `AudioContext` singleton (creating one per beep hits browser limits).
The user gesture of clicking Start satisfies the autoplay policy; if the context is
suspended on later beeps, call `ctx.resume()`.

```ts
let ctx: AudioContext | null = null;
function getCtx(): AudioContext {
  /* lazy singleton + resume if suspended */
}
export function playBeep(times: number, freq: number): void {
  const c = getCtx();
  for (let i = 0; i < times; i++) {
    const start = c.currentTime + i * 0.4;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  }
}
```

### Engine hook (`usePomodoroEngine.ts`) — the core

Returns `{ phase, status, displayMs, totalMs, completedWorkSessions, start, pause, skip,
reset, updateSettings }`. Internally:

- **`computeRemaining(data)`** — pure function:
  - `running && endsAt != null` → `max(0, endsAt - Date.now())`
  - `paused && remainingMs != null` → `remainingMs`
  - `idle` → `phaseDurationMs(phase, settings)`
- **Local display state** — `useState(() => computeRemaining(data))`. Updated every
  250 ms by an interval that is mounted only when `status === "running"`.
- **Tick handler** (mounted when `running`):
  - if `Date.now() >= endsAt` → call `processPhaseEnd()` (one transition per tick — see
    decisions above)
  - then `setDisplayMs(computeRemaining(data))`
- **Visibility / focus listeners** (mounted when `running`):
  - on `visibilitychange` with `document.hidden === false`, or on `window focus`, fire
    the tick handler immediately — covers the "tab was backgrounded, interval throttled"
    case.
- **`processPhaseEnd()`** (the only non-trivial logic):
  ```ts
  if (data.phase === "work") {
    const newCount = data.completedWorkSessions + 1;
    const isLong = newCount % data.settings.sessionsBeforeLongBreak === 0;
    const nextPhase = isLong ? "long-break" : "short-break";
    const durationMs =
      (isLong
        ? data.settings.longBreakMinutes
        : data.settings.shortBreakMinutes) * 60_000;
    playBeep(2, 660);
    updateNodeData(id, {
      phase: nextPhase,
      completedWorkSessions: newCount,
      endsAt: Date.now() + durationMs,
      status: "running",
    });
  } else {
    playBeep(3, 880);
    updateNodeData(id, {
      phase: "work",
      endsAt: Date.now() + data.settings.workMinutes * 60_000,
      status: "running",
    });
  }
  ```
- **Actions:**
  - **start** (idle/paused → running): compute fresh `endsAt = Date.now() + remainingMs`,
    clear `remainingMs`, set `status: "running"`. Call `getCtx()` once here to satisfy
    autoplay policy (no beep).
  - **pause** (running → paused): `remainingMs = max(0, endsAt - Date.now())`,
    `endsAt: null`, `status: "paused"`.
  - **skip** (any non-idle → advance phase): same as `processPhaseEnd` but without the
    `Date.now() >= endsAt` precondition, and without requiring `status === "running"`
    (so skip works from paused too). Skip does beep (it's still a phase change).
  - **reset** (any → idle work): `phase: "work"`, `status: "idle"`, `endsAt: null`,
    `remainingMs: null`, `completedWorkSessions: 0`. No beep.
  - **updateSettings** (only allowed when `status !== "running"`): merge the new
    settings. If `status === "idle"`, the display recomputes automatically; if
    `"paused"`, also update `remainingMs` to the new phase duration.

### UI (`PomodoroNode.tsx`)

```
┌─────────────────────────────────────┐
│ Pomodoro               [⚙][X]       │  WindowFrame header; title "Pomodoro";
├─────────────────────────────────────┤   headerAction = settings Popover trigger
│          WORK                       │  phase label, uppercase, text-xs muted
│       ╭───────────╮                 │
│      │   24:32    │                 │  SVG progress ring around the time;
│       ╰───────────╯                 │   stroke-dashoffset = circ * (1 - elapsed/total)
│       Pomodoro 1 / 4                │  session count line (muted)
│                                     │
│   [▶ Start]  [⏭ Skip]  [↻ Reset]    │  buttons row (size="sm")
└─────────────────────────────────────┘
```

- **Time display:** `text-4xl font-mono tabular-nums` (digits don't jitter). Format
  `MM:SS`. (Pomodoro phases are short — no `H:MM:SS` needed.)
- **Progress ring:** SVG `<circle>` two layers — bg stroke `text-muted-foreground/20`,
  progress stroke `text-foreground` (or a phase-specific token). Circumference
  `2 * π * r`; progress `stroke-dasharray = circumference`,
  `stroke-dashoffset = circumference * (1 - displayMs / totalMs)`. Rotate `-90deg` so it
  starts at 12 o'clock.
- **Phase tint:** set `WindowFrame`'s `color` prop per phase — work = `""` (default),
  short-break = `"bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200"`,
  long-break = `"bg-blue-50 dark:bg-blue-950/30 border-blue-200"`. (Mirror the
  sticky-note `color` prop usage at `StickyNoteNode.tsx:82`.)
- **Controls:** single primary `Button` toggles Start/Pause by `status`; `Skip` and
  `Reset` are `variant="outline"`. Use shadcn `Button` `size="sm"`.
- **Settings Popover** (gear): four `<Input type="number" min={1}>` for the four settings
  fields, plus a small "Apply" `Button`. Read into local form state on open; on Apply,
  call `updateSettings(merged)` and close. The gear trigger is disabled with
  `title="Pause to change settings"` while `status === "running"`.

### `meta.ts`

```ts
import { Tomato } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { PomodoroNode } from "./PomodoroNode";

export const pomodoroNodeTemplate: NodeTemplate = {
  id: "pomodoro",
  label: "Pomodoro Timer",
  icon: Tomato,
  size: { width: 280, height: 360 },
  defaultData: {
    settings: {
      workMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLongBreak: 4,
    },
    phase: "work",
    status: "idle",
    endsAt: null,
    remainingMs: null,
    completedWorkSessions: 0,
  },
  component: PomodoroNode,
};
```

### `index.ts` (barrel)

```ts
export { PomodoroNode } from "./PomodoroNode";
export { pomodoroNodeTemplate } from "./meta";
export type {
  PomodoroNodeData,
  PomodoroPhase,
  PomodoroSettings,
  PomodoroStatus,
} from "./types";
```

### Registry edit (`template/index.ts`)

One import line alongside the others + one entry in the `nodeTemplates` array:

```ts
import { pomodoroNodeTemplate } from "../implementations/pomodoro-node";
// ...
export const nodeTemplates: NodeTemplate[] = [
  chatTemplate,
  stickyNoteTemplate,
  mermaidTemplate,
  textNodeTemplate,
  todoNodeTemplate,
  terminalNodeTemplate,
  webviewNodeTemplate,
  pomodoroNodeTemplate,
];
```

## Tasks

- [x] 1. Create `pomodoro-node/types.ts` with the type definitions above
  - verify: `pnpm --filter web-app check-types` passes after task 4 (the type only
    surfaces once consumed); standalone check is "file exists at the path and exports
    `PomodoroNodeData`"
  - files: `apps/web-app/src/features/desk/nodes/implementations/pomodoro-node/types.ts`
- [x] 2. Create `pomodoro-node/audio.ts` with the `playBeep` helper + `AudioContext`
     singleton
  - verify: file exists; `playBeep` is exported with signature `(times: number, freq:
number) => void`
  - files: `apps/web-app/src/features/desk/nodes/implementations/pomodoro-node/audio.ts`
- [x] 3. Create `pomodoro-node/usePomodoroEngine.ts` — the timestamp-based engine hook
     with catch-up logic, visibility listener, and all five actions
  - verify: file exports `usePomodoroEngine`; the function signature takes
    `(id: string, data: PomodoroNodeData, updateNodeData: ...)` and returns
    `{ phase, status, displayMs, totalMs, completedWorkSessions, start, pause, skip,
 reset, updateSettings }`
  - files: `apps/web-app/src/features/desk/nodes/implementations/pomodoro-node/usePomodoroEngine.ts`
- [x] 4. Create `pomodoro-node/PomodoroNode.tsx` — `WindowFrame` + SVG progress ring +
     phase label + time display + controls + settings Popover. Wire `usePomodoroEngine`
  - verify: `pnpm --filter web-app check-types` passes (this is the first task that
    exercises the whole graph)
  - files: `apps/web-app/src/features/desk/nodes/implementations/pomodoro-node/PomodoroNode.tsx`
- [x] 5. Create `pomodoro-node/meta.ts` and `pomodoro-node/index.ts`
  - verify: both files exist; `meta.ts` exports `pomodoroNodeTemplate` with
    `id: "pomodoro"`; `index.ts` re-exports the component, template, and types
  - files: `apps/web-app/src/features/desk/nodes/implementations/pomodoro-node/meta.ts`,
    `apps/web-app/src/features/desk/nodes/implementations/pomodoro-node/index.ts`
- [x] 6. Register the template in `template/index.ts` (one import + one array entry)
  - verify: `pnpm --filter web-app check-types && pnpm --filter web-app lint` both pass
  - files: `apps/web-app/src/features/desk/nodes/template/index.ts`
- [ ] 7. Manual behavior check in `pnpm run dev`
  - verify: drag a Pomodoro node from the sidebar; default shows "25:00 WORK idle";
    Start counts down; set `workMinutes = 1` in the gear, wait → on minute boundary a
    beep plays and the node transitions to "05:00 SHORT-BREAK running" with a green
    tint; pause freezes; skip advances phase; reset returns to "25:00 WORK idle"; with
    the timer running, reload the page — the timer reconstructs from `endsAt` and
    continues without a backward jump
  - files: —

Order rationale: tasks 1–3 are leaf modules with no cross-dependencies; task 4 is the
integration point where check-types first becomes meaningful; task 5 finishes the
folder; task 6 wires it in; task 7 is the human-in-the-loop confirmation of the
persistence-across-reload + catch-up behavior that cannot be asserted by a shell command.

## Done when

- [x] A "Pomodoro Timer" entry with an icon appears in the Desk node sidebar
      (used `AlarmClock` — `Tomato` is not exported by the installed `lucide-react`
      version; per plan fallback order `AlarmClock` was chosen over `Hourglass`)
- [ ] Dropping it creates a node showing "25:00 WORK" with a progress ring
- [ ] Start counts down; on phase end a beep plays and the next phase auto-starts (work →
      short-break green tint → work → … → long-break blue tint after the configured
      session count → work)
- [ ] Pause freezes the display and the gear becomes interactive; Skip jumps to the next
      phase; Reset returns to "25:00 WORK idle" with `completedWorkSessions: 0`
- [ ] Editing any of the four settings in the gear (only while not running) changes the
      next phase's duration
- [ ] With a phase running, reloading the page reconstructs the timer from `endsAt` and
      continues showing the correct remaining time; if the phase ended during the reload,
      the next phase starts and a beep plays on remount
- [x] `pnpm --filter web-app check-types && pnpm --filter web-app lint` are clean

## Notes for implementer

- **Single most important rule:** do not call `updateNodeData` on every interval tick —
  only on start / pause / skip / reset / settings-change / phase-transition. The live
  display is local React state. Writing to `flowStore` 4×/second spams localStorage.
- Read the stopwatch plan at `docs/plan/20260809-add-stopwatch-desk-node.md` first — if
  the stopwatch node has already been implemented, its files are the closest analogue.
  Otherwise fall back to `todo-node` and `sticky-note` for `WindowFrame` /
  `updateNodeData` / `Popover` patterns.
- **Audio context + autoplay policy:** create/resume the `AudioContext` inside the
  Start click handler (a user gesture) — not at module load. If the user reloads the page
  while a phase is running and the phase ends before their next click, the beep on
  remount may be blocked by the browser (no prior gesture in this tab). That's an
  acceptable edge case — do not add a fake "click to enable sound" modal.
- **Phase transition cap:** process at most one phase transition per tick. The next tick
  (250 ms later) handles the next one. This prevents a long absence (e.g. node was
  unmounted for 3 hours) from silently burning through dozens of pomodoros in a tight
  loop on remount.
- No comments unless asked. No `.bak` files — git covers rollback. No Storybook story or
  tests unless explicitly requested (per the scaffold skill).
- If `check-types` fails it is almost always one of: wrong `lucide-react` export name
  (`Tomato` should exist — fall back to `AlarmClock` then `Hourglass`); the
  `Node<..., "pomodoro">` literal drifted from the folder name; a missing
  `import type` for type-only imports (`verbatimModuleSyntax` is on).
- Run `pnpm --filter web-app check-types && pnpm --filter web-app lint` before declaring
  done.
