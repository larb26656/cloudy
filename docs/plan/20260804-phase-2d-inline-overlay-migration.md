---
title: "Phase 2D: Migrate inline-row and overlay state JSX to shared components"
slug: phase-2d-inline-overlay-migration
id: 20260804-phase-2d-inline-overlay-migration
status: done
created: 2026-08-04
source: planning session 2026-08-04 (Phase 1 review)
---

# Plan: Phase 2D — Migrate inline-row and overlay state JSX to shared components

## Why

Four consumers render state JSX in **inline rows or absolute overlays** and hand-roll the
spinner / message / retry button instead of using the shared components. Two are tiny
inline rows (`InfiniteScrollTrigger`'s CSS spinner, `ErrorConnectionNotify`'s banner);
two are absolute-positioned overlays (`TerminalView`'s status overlay, `WebviewContent`'s
iframe-loading overlay). After Phase 2A adds `className`, `spinner`, `icon`, `retryLabel`,
and silent-title support to the shared components, all four can migrate cleanly while
preserving their visual intent (including custom spinners and custom retry button labels).

## Target file

| Path                                                                             | Action                                                                                     |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `apps/web-app/src/components/InfiniteScrollTrigger.tsx`                          | edit — replace CSS spinner (lines 18-22) with `LoadingState`                               |
| `apps/web-app/src/features/home/components/ErrorConnectionNotify.tsx`            | edit — replace inline banner (whole component, lines 5-16) with `ErrorState`               |
| `apps/web-app/src/components/terminal/TerminalView.tsx`                          | edit — replace `renderOverlay` body (lines 47-88) with `LoadingState` / `ErrorState` calls |
| `apps/web-app/src/features/home/tabs/implementations/webview/WebviewContent.tsx` | edit — replace iframe loading overlay (lines 94-98) with `LoadingState`                    |

Four files. `InfiniteScrollTrigger` and `WebviewContent` use custom spinners;
`ErrorConnectionNotify` uses a custom icon + custom retry label; `TerminalView` uses both
plus a `className` for absolute overlay positioning. All four depend on Phase 2A's shared
component prop additions.

## Context the new session needs

### What exists today (read these first)

- **Phase 2A must be complete first** — read
  `docs/plan/20260804-phase-2a-shared-props-and-dropdown-sidebar-migration.md`. It adds:
  - `ErrorState`: `className?`, `icon?: LucideIcon`, `retryLabel?: string`, `bare?`
  - `LoadingState`: `className?`, `spinner?: React.ReactNode | false`, `title?: string | null`

  All four migrations below rely on at least one of these new props.

- **`apps/web-app/src/components/InfiniteScrollTrigger.tsx`** (25 lines, whole component)
  — when `isLoading`, renders `<div className="flex items-center justify-center py-2"><div
className="size-5 animate-spin rounded-full border-2 border-muted-foreground
border-t-transparent" /></div>`. **Pure CSS spinner**, no `Loader2` icon, no text. Maps
  to `<LoadingState size="inline" title={null} spinner={<div className="size-5 animate-spin
rounded-full border-2 border-muted-foreground border-t-transparent" />} />` — preserves
  the exact CSS spinner via the new `spinner` slot.
- **`apps/web-app/src/features/home/components/ErrorConnectionNotify.tsx`** (18 lines,
  whole component) — `<div className="flex items-center justify-center gap-2 bg-red-500/10
dark:bg-red-500/20 py-1 px-2 text-xs text-red-700 dark:text-red-300"><WifiOffIcon
className="size-3.5" /><span>Connection lost.</span><Button size="xs" variant="outline"
onClick={reconnect}>Reconnect</Button></div>`. Maps to `<ErrorState size="inline"
icon={WifiOffIcon} title="Connection lost." retryLabel="Reconnect" onRetry={reconnect}
className="bg-red-500/10 dark:bg-red-500/20 py-1 px-2 text-xs text-red-700
dark:text-red-300" />` — note this **does not** use `bare` because we want the icon,
  title, and retry button; we override the icon and retry label instead. There's a known
  visual change: `ErrorState`'s inline title is `text-destructive` (red) which matches the
  banner's red text, but the button size differs (`ErrorState`'s retry button is `size="sm"`
  with `RotateCcw` icon vs. the current `size="xs"` plain "Reconnect" button). See
  Decisions below.
- **`apps/web-app/src/components/terminal/TerminalView.tsx:47-88`** — `renderOverlay`
  returns JSX for four `TerminalStatus` values:
  - `"connecting"`: `<p className="text-sm text-muted-foreground">Connecting…</p>`
  - `"connected"`: returns `null`
  - `"spawning"`: `<p className="text-sm text-muted-foreground">Starting shell…</p>`
  - `"exited"`: `<p>Shell exited.</p>` + `<Button>Restart</Button>` (with `RotateCcw`)
  - `"error"`: `<p className="text-sm text-destructive">{error ?? "Terminal error"}</p>`
    - `<Button>Retry</Button>` (with `RotateCcw`)

  These render inside an absolute overlay at lines 38-42: `<div className="absolute inset-0
flex flex-col items-center justify-center gap-2 bg-black/70 text-center">{overlay}</div>`.
  The overlay wrapper stays; only `renderOverlay`'s returned JSX changes.

- **`apps/web-app/src/features/home/tabs/implementations/webview/WebviewContent.tsx:94-98`**
  — when `isLoading`, renders `<div className="absolute inset-0 flex items-center
justify-center bg-background/50 z-10"><RotateCw className="size-6 animate-spin"
/></div>`. **Custom `RotateCw` spinner**, no text, absolute overlay. Maps to
  `<LoadingState title={null} spinner={<RotateCw className="size-6 animate-spin" />}
className="absolute inset-0 z-10 bg-background/50" />` — note: the wrapping `<div
className="absolute inset-0 flex items-center justify-center ...">` is replaced by passing
  `className="absolute inset-0 z-10 bg-background/50"` directly to `LoadingState`. The
  flex-centering is built into `LoadingState`'s silent branch.

### Decisions already made (locked, do not revisit)

1. **`InfiniteScrollTrigger` keeps the CSS border spinner** via the new `spinner` slot.
   Do **not** replace it with `Loader2` — the border style is a deliberate "lighter"
   spinner for list-end loading indicators, and changing it would be a regression.
2. **`WebviewContent` keeps `RotateCw`** (not `Loader2`) via the `spinner` slot. `RotateCw`
   semantically matches the "refresh browser" action and is the same icon used in the
   toolbar's refresh button (line 79) — visual continuity matters.
3. **`ErrorConnectionNotify` accepts a visual change on the retry button.** The current
   button is `<Button size="xs" variant="outline">Reconnect</Button>` (plain text, no icon).
   `ErrorState`'s retry button is `<Button variant="outline" size="sm"><RotateCcw
className="size-4 mr-2" />Try again</Button>` — bigger, with a `RotateCcw` icon, and the
   label is overridden to `"Reconnect"`. This is a deliberate trade-off for consistency. If
   the reviewer pushes back, this consumer can stay inline (it's only 12 lines).
4. **`TerminalView`'s overlay wrapper stays.** The `<div className="absolute inset-0 flex
flex-col items-center justify-center gap-2 bg-black/70 text-center">` is **not** part of
   `renderOverlay`'s return — it's the parent that wraps `{overlay}`. Only the JSX returned
   BY `renderOverlay` changes. The two "Connecting…" / "Starting shell…" text-only branches
   migrate to `<LoadingState title="Connecting…" spinner={false} />` (text-only mode); the
   "exited" branch migrates to `<ErrorState title="Shell exited." retryLabel="Restart"
onRetry={reconnect} />`; the "error" branch migrates to `<ErrorState title={error ??
"Terminal error"} retryLabel="Retry" onRetry={reconnect} />` — note `error` here is a
   string (the message), and `ErrorState` expects `message` not `title`. Adjust
   accordingly: `<ErrorState message={error ?? "Terminal error"} retryLabel="Retry"
onRetry={reconnect} />` and the `ErrorState` will render its default "Error" title above
   the message. To suppress the title, pass `title=""` if `ErrorState`'s post-2A impl
   allows it, OR pass `bare` (but `bare` ignores `onRetry`). If neither works cleanly, keep
   the "error" branch as inline JSX and migrate only the other three.
5. **Do not delete `renderOverlay`** — keep it as a helper that returns
   `LoadingState`/`ErrorState`/null based on `status`. The `TerminalView` component's
   `<div>` overlay wrapper still calls it.
6. **`WebviewContent`'s `RotateCw` import stays** — it's also used for the refresh button
   in the toolbar (line 79). Only the iframe-overlay usage changes.

### Conventions (from `apps/web-app/AGENTS.md`)

- Tailwind v4, `cn(...)` from `src/lib/utils.ts`.
- Icons from `lucide-react` only.
- ESM only; `import type` for type-only imports.
- No comments unless asked.
- `lucide-react` exports `WifiOff` (the canonical name); the current code uses
  `WifiOffIcon` as the import alias. Either works — keep the existing alias to minimize
  diff noise, or rename to `WifiOff` to match the lucide canonical name. Pick one and be
  consistent.

### Gotchas

- `TerminalView.tsx`'s `renderOverlay` takes `(status, error, reconnect)`. The `error`
  parameter is `string | null`, not an `Error` instance. Pass it directly to `ErrorState`'s
  `message` prop.
- `TerminalView.tsx` imports `RotateCcw` from `lucide-react` (used in the inline Retry
  buttons). After migration, `RotateCcw` may no longer be used in this file (it moves into
  `ErrorState`). Check with `rg "RotateCcw" apps/web-app/src/components/terminal/TerminalView.tsx`
  after editing — if no matches, remove it from the import.
- `WebviewContent.tsx`'s `isLoading` overlay must keep `z-10` so it sits above the iframe
  (`z-0` by default). The current `className` includes `z-10`; preserve it.
- `ErrorConnectionNotify.tsx` is rendered conditionally by its parent (only when the global
  event stream is disconnected). The component itself has no conditional logic — it always
  renders the banner. Keep that contract.
- `InfiniteScrollTrigger`'s `enabled && <div ref={sentinelRef} className="h-4 w-full" />`
  sentinel div is **not** a loading state — it's the IntersectionObserver sentinel. Do not
  migrate or remove it. Only the `isLoading` branch migrates.

## Tasks

- [x] 1. **Migrate `InfiniteScrollTrigger`**
  - Replace lines 18-22 (`{isLoading && (<div className="flex items-center justify-center
py-2"><div className="size-5 animate-spin rounded-full border-2 border-muted-foreground
border-t-transparent" /></div>)}`) with `{isLoading && (<LoadingState size="inline"
title={null} spinner={<div className="size-5 animate-spin rounded-full border-2
border-muted-foreground border-t-transparent" />} />)}`. Add `import { LoadingState }
from "@/components/ui/loading-state"` at the top.
  - verify: `pnpm --filter web-app check-types` clean. Confirm the sentinel `<div
ref={sentinelRef}>` is untouched.
  - files: `apps/web-app/src/components/InfiniteScrollTrigger.tsx`

- [x] 2. **Migrate `ErrorConnectionNotify`**
  - Replace the whole component body (lines 7-15) with: `return ( <ErrorState size="inline"
icon={WifiOffIcon} title="Connection lost." retryLabel="Reconnect" onRetry={reconnect}
className="bg-red-500/10 dark:bg-red-500/20 py-1 px-2 text-xs text-red-700
dark:text-red-300" /> );`. Add `import { ErrorState } from "@/components/ui/error-state"`.
    Remove the `Button` import (no longer used directly). Keep the `WifiOffIcon` import.
  - verify: `pnpm --filter web-app check-types` clean; `rg "from \"@/components/ui/button\""
apps/web-app/src/features/home/components/ErrorConnectionNotify.tsx` returns no matches.
  - files: `apps/web-app/src/features/home/components/ErrorConnectionNotify.tsx`

- [x] 3. **Migrate `TerminalView.renderOverlay`**
  - Rewrite the body of `renderOverlay` (lines 47-88) to return `LoadingState` /
    `ErrorState` / null. The `"connecting"` branch returns `<LoadingState title="Connecting…"
spinner={false} />`; the `"spawning"` branch returns `<LoadingState title="Starting
shell…" spinner={false} />`; the `"exited"` branch returns `<ErrorState title="Shell
exited." retryLabel="Restart" onRetry={reconnect} />`; the `"error"` branch returns
    `<ErrorState message={error ?? "Terminal error"} retryLabel="Retry" onRetry={reconnect}
/>`. Add `import { LoadingState } from "@/components/ui/loading-state"` and `import {
ErrorState } from "@/components/ui/error-state"` at the top of the file. Remove
    `RotateCcw` from the `lucide-react` import if no longer used in this file, and remove
    the `Button` import if no longer used.
  - verify: `pnpm --filter web-app check-types` clean. Open the file and confirm: (a)
    `renderOverlay` still takes `(status, error, reconnect)`; (b) the parent overlay
    wrapper `<div className="absolute inset-0 flex flex-col items-center justify-center
gap-2 bg-black/70 text-center">` is unchanged; (c) the `TerminalStatus` and
    `XTermTerminal` type re-exports at the bottom are preserved.
  - files: `apps/web-app/src/components/terminal/TerminalView.tsx`

- [x] 4. **Migrate `WebviewContent` iframe overlay**
  - Replace lines 94-98 (`{isLoading && (<div className="absolute inset-0 flex items-center
justify-center bg-background/50 z-10"><RotateCw className="size-6 animate-spin"
/></div>)}`) with `{isLoading && (<LoadingState title={null} spinner={<RotateCw
className="size-6 animate-spin" />} className="absolute inset-0 z-10 bg-background/50"
/>)}`. Add `import { LoadingState } from "@/components/ui/loading-state"` at the top.
    Keep the `RotateCw` import (still used in the toolbar refresh button at line 79).
  - verify: `pnpm --filter web-app check-types` clean; `rg "RotateCw"
apps/web-app/src/features/home/tabs/implementations/webview/WebviewContent.tsx` returns
    at least two matches (toolbar + loading overlay).
  - files: `apps/web-app/src/features/home/tabs/implementations/webview/WebviewContent.tsx`

- [x] 5. **Full verification**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types` all green;
    `pnpm --filter web-app exec vitest run` passes.
  - files: —

## Done when

- [x] `InfiniteScrollTrigger` renders the CSS border spinner via `LoadingState`'s
      `spinner` slot (visual identical to before).
- [x] `ErrorConnectionNotify` renders via `ErrorState` with `WifiOffIcon`, `retryLabel`,
      and the red banner `className` (button visual differs — bigger, with `RotateCcw`
      icon).
- [x] `TerminalView.renderOverlay` returns `LoadingState` / `ErrorState` instances for all
      four status branches; the parent overlay wrapper is unchanged.
- [x] `WebviewContent` iframe-loading overlay renders via `LoadingState` with the custom
      `RotateCw` spinner.
- [x] `rg "animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
  apps/web-app/src` returns exactly one match (inside the `LoadingState spinner={...}`
      slot in `InfiniteScrollTrigger`).
- [x] `pnpm --filter web-app lint && pnpm --filter web-app check-types` clean.
- [x] `pnpm --filter web-app exec vitest run` passes.

## Notes for implementer

- **Depends on Phase 2A.** Read
  `docs/plan/20260804-phase-2a-shared-props-and-dropdown-sidebar-migration.md` first and
  confirm 2A is merged. The new `ErrorState.icon`, `ErrorState.retryLabel`,
  `LoadingState.spinner`, `LoadingState.title={null}`, and `*.className` props are all
  required here.
- If `TerminalView`'s `"error"` branch (Task 3) doesn't fit `ErrorState` cleanly (because
  `ErrorState` always renders a title row above the message), keep that one branch as
  inline JSX and migrate only the other three branches. Note the deviation in the commit
  message.
- Do not migrate `ModelSelector`/`AgentSelector`/`SessionList`/`CreateChatDialog`/
  `ChatMinimap` (Plan 2A), `MermaidNode`/`TodoNode` (Plan 2B), or `WorkspaceSelectStep`/
  `ChatContent`/`file-update-viewer`/`settings/index.tsx`/`ChatEmptyState` (Plan 2C).
- Visual changes to expect (call out in the commit message):
  - `ErrorConnectionNotify`: retry button grows from `size="xs"` to `size="sm"` and gains
    a `RotateCcw` icon. Acceptable trade-off for consistency.
  - `TerminalView`: text branches may gain slightly different sizing (LoadingState's
    inline text vs. the current `<p className="text-sm text-muted-foreground">`); adjust
    `className` if the visual shift is too large.
  - Others: visually identical (CSS spinner and `RotateCw` are preserved via the `spinner`
    slot).
- Commit choreography suggestion (do not commit unless asked): Tasks 1-4 as a single
  commit ("migrate inline-row and overlay state JSX to shared components").
