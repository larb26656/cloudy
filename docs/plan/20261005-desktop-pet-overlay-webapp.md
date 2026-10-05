---
title: Desktop pet overlay - web-app side
slug: desktop-pet-overlay-webapp
id: 20261005-desktop-pet-overlay-webapp
status: ready
created: 2026-10-05
source: planning session 2026-10-05
---

# Plan: Desktop pet overlay - web-app side

## Why

The floating pet (`FloatingPet`) only lives inside the main web-app window, so it disappears when the window is minimized or covered. We want the pet to float on the desktop itself, outside the app window — an always-on-top overlay owned by the Electron shell. This plan is the **web-app half**: extract the pet's sprite/state/session logic into reusable modules, add a desktop bridge abstraction, and serve a dedicated transparent `/pet` route that a future Electron pet window will load. The Electron window itself is a separate plan (`20261005-desktop-pet-overlay-electron`) that depends on this one.

## Target file

| Path                                                            | Action |
| --------------------------------------------------------------- | ------ |
| `apps/web-app/src/components/pet/PetSprite.tsx`                 | create |
| `apps/web-app/src/hooks/usePetActivity.ts`                      | create |
| `apps/web-app/src/components/pet/openSessionTab.ts`             | create |
| `apps/web-app/src/lib/desktop/petBridge.ts`                     | create |
| `apps/web-app/src/components/pet/PetOverlay.tsx`                | create |
| `apps/web-app/src/components/pet/PetOverlay.component.test.tsx` | create |
| `apps/web-app/src/routes/pet.tsx`                               | create |
| `apps/web-app/src/types/desktop.d.ts`                           | edit   |
| `apps/web-app/src/components/pet/FloatingPet.tsx`               | edit   |
| `apps/web-app/src/routes/__root.tsx`                            | edit   |
| `apps/web-app/src/index.css`                                    | edit   |

## Context the new session needs

- **What exists**: `FloatingPet.tsx` is a single 432-line component owning everything:
  sprite animation (lines 42-93), question/permission fetchers (95-136), activity
  derivation via `useQueries` (151-215), session→tab opening (217-239), in-window
  pointer drag (246-282), dismiss/restore (284-295), and the Popover UI (372-431).
  It is mounted app-wide in `routes/__root.tsx:7-14`. Its tests
  (`FloatingPet.component.test.tsx`) must keep passing **unchanged** — they run in
  plain jsdom with no `window.__CLOUDY_DESKTOP__`, i.e. browser mode.
- **Electron detection**: `window.__CLOUDY_DESKTOP__` is exposed by the desktop
  preload (`apps/desktop/src/preload.ts:22-24`), declared in
  `src/types/desktop.d.ts:5`, and surfaced as `isModeElectron` in
  `src/config/env.ts:5`. The main window and the future pet window BOTH get this
  flag (same preload). Desktop plans add a `windowKind: "main" | "pet"` field.
- **Decision — one pet per screen**: in Electron mode the in-window `FloatingPet`
  renders `null` (the overlay window owns the pet). In plain browser mode nothing
  changes. Guard: `if (isModeElectron) return null;` at the top of `FloatingPet`.
  Both Electron windows render through `__root.tsx`, so this single guard covers
  the main window AND prevents a duplicate pet inside the pet window itself.
- **The `/pet` route renders inside the normal root layout** — `__root.tsx` wraps
  `Outlet` in `div.flex.h-dvh.bg-background.pt-safe.pb-safe`. A transparent overlay
  must not paint that background: when `windowKind === "pet"`, the route component
  adds `data-pet-window` to `<html>` on mount, and `__root.tsx` drops
  `bg-background`/safe-padding classes when that attribute is present (or via a
  `useRouterState().location.pathname === "/pet"` check — pick one mechanism and
  use it for both the wrapper class swap and a `.pet-overlay` CSS rule in
  `index.css`: `html[data-pet-window], html[data-pet-window] body { background:
transparent; overflow: hidden; }`).
- **PetOverlay UX (phase 1 decision)**: the overlay window is pet-sized (~144×160
  CSS px incl. badge margin). The sprite sits at the **bottom-right** of the window.
  Clicking the sprite expands an activity panel that grows **up-and-left**: renderer
  calls `petBridge.setSize(width, height)` and the Electron side keeps the
  bottom-right corner anchored (specified in the Electron plan). The panel reuses
  the exact list UI from `FloatingPet`'s popover (records with
  waiting/working state, `EmptyState`/`ErrorState`/`LoadingState` compact variants).
  Drag moves the whole window via bridge calls — NOT `-webkit-app-region` (it would
  swallow pointer events and fight the expand interaction).
- **Decision — no click-through in phase 1**: do NOT call
  `setIgnoreMouseEvents`. The window is pet-sized, so transparent-pixel clicks are
  rare; hover-forwarding races are worse. Follow-up if it feels obtrusive.
- **Cross-window session opening**: clicking a record in the overlay must open the
  chat tab in the MAIN window. `openSessionTab.ts` extracts the logic from
  `FloatingPet.handleOpenSession` (lines 217-239) but instead of calling `openTab`
  directly it returns a serializable
  `{ type: "chat" | "bot-chat"; data: TabDataMap[...] }` payload. The overlay sends
  it via `petBridge.openSession(payload)`; the main window listens via
  `petBridge.onOpenSession` (wired in a `useEffect` in `__root.tsx`, guarded to run
  only when `isModeElectron && windowKind !== "pet"`) and calls
  `useTabStore.getState().openTab(payload.type, payload.data)` through a small
  `switch` on `payload.type` (openTab's generic signature doesn't accept a dynamic
  union directly). Workspace lookup (`useWorkspaces` by `directory`) happens in the
  overlay before sending — same shape as `FloatingPet.tsx:217-239`.
- **`petBridge.ts` shape** (`src/lib/desktop/petBridge.ts`): a typed facade over
  `window.__CLOUDY_DESKTOP__?.petBridge` where every method is a **no-op/undefined
  fallback in browser mode** (so `/pet` renders harmlessly in a plain browser —
  useful for Storybook/component tests). Shape:
  `dragStart() / dragMove() / dragEnd() / setSize(w, h) / focusMain() /
openSession(payload) / onOpenSession(cb): () => void`.
  Extend `desktop.d.ts` `DesktopInfo` with optional
  `windowKind?: "main" | "pet"` and optional `petBridge?: PetBridgeApi`.
- **`usePetActivity.ts`**: extract the fetchers (95-136), `useQueries` blocks
  (164-180), and the records/petState derivation (182-215) into a hook returning
  `{ records, petState, waitingCount, workingCount, isLoading, error, workspaces }`.
  `FloatingPet` and `PetOverlay` both consume it. Keep `refetchIntervalInBackground:
false` — the pet window is small but polls in the background while the main
  window is hidden, and that's desired for the overlay.
- Sprite assets live at `public/sprite/cloudy-pet/sprite-sheet.png` — `/pet` loads
  from the same origin, no asset changes.

## Tasks

- [x] 1. **Extract `PetSprite` into `src/components/pet/PetSprite.tsx`** (move lines 42-93 incl. state maps and frame timer verbatim; export `PetState` type too).
  - verify: `pnpm --filter web-app exec vitest run src/components/pet/FloatingPet.component.test.tsx`
  - files: `apps/web-app/src/components/pet/PetSprite.tsx`, `apps/web-app/src/components/pet/FloatingPet.tsx`
- [x] 2. **Extract activity data into `src/hooks/usePetActivity.ts`** (fetchers + `useQueries` + records/petState derivation; `FloatingPet` consumes the hook, behavior unchanged).
  - verify: `pnpm --filter web-app exec vitest run src/components/pet/FloatingPet.component.test.tsx && pnpm --filter web-app check-types`
  - files: `apps/web-app/src/hooks/usePetActivity.ts`, `apps/web-app/src/components/pet/FloatingPet.tsx`
- [x] 3. **Extract `openSessionTab` into `src/components/pet/openSessionTab.ts`** returning `{ type, data }`; `FloatingPet.handleOpenSession` uses it then calls `openTab`.
  - verify: `pnpm --filter web-app exec vitest run src/components/pet/FloatingPet.component.test.tsx`
  - files: `apps/web-app/src/components/pet/openSessionTab.ts`, `apps/web-app/src/components/pet/FloatingPet.tsx`
- [x] 4. **Extend `desktop.d.ts` (`windowKind`, `petBridge`) and create `petBridge.ts`** with browser no-op fallbacks.
  - verify: `pnpm --filter web-app check-types`
  - files: `apps/web-app/src/types/desktop.d.ts`, `apps/web-app/src/lib/desktop/petBridge.ts`
- [x] 5. **Create `PetOverlay` + `/pet` route + overlay CSS**: transparent background, `PetSprite` bottom-right, drag via `petBridge.drag*`, expandable activity panel with `setSize`, record click → `openSessionTab` → `petBridge.openSession`. Add `html[data-pet-window]` transparency rule to `index.css`.
  - verify: `pnpm --filter web-app exec vitest run src/components/pet/PetOverlay.component.test.tsx`
  - files: `apps/web-app/src/components/pet/PetOverlay.tsx`, `apps/web-app/src/components/pet/PetOverlay.component.test.tsx`, `apps/web-app/src/routes/pet.tsx`, `apps/web-app/src/index.css`
- [x] 6. **Hide `FloatingPet` in Electron and wire the session relay in `__root.tsx`** (`isModeElectron` guard; `onOpenSession` effect with the `switch` → `openTab`; root wrapper drops `bg-background`/safe-padding for the pet window).
  - verify: `pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run src/components/pet/FloatingPet.component.test.tsx`
  - files: `apps/web-app/src/components/pet/FloatingPet.tsx`, `apps/web-app/src/routes/__root.tsx`
- [x] 7. **Full quality pass.**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run src/components/pet/`
  - files: all above

## Done when

- [x] `http://localhost:3001/pet` in a plain browser renders the pet sprite full-bleed on a transparent background with no app chrome (panel opens; session clicks are graceful no-ops without the bridge).
- [x] `FloatingPet` renders `null` when `window.__CLOUDY_DESKTOP__` is present, and behaves exactly as before in browser mode (existing component tests pass unmodified).
- [x] `pnpm --filter web-app lint`, `pnpm --filter web-app check-types`, and the pet component tests all pass.
- [x] No logic was duplicated between `FloatingPet` and `PetOverlay` — sprite, activity, and session-opening each have exactly one implementation.

## Notes for implementer

- Do not edit `src/routeTree.gen.ts` (generated); the `/pet` route file is picked up automatically.
- `PetOverlay.component.test.tsx` runs in the jsdom project (`*.component.test.tsx`); stub `window.__CLOUDY_DESKTOP__` with a fake `petBridge` (vitest spies) — the real bridge is Electron-only.
- Type-only imports for types (`import type { ... }`), ESM only, TanStack Query for all server state — no new Zustand store is needed for this plan.
- Use shared state components (`EmptyState`/`ErrorState`/`LoadingState`, `size: "compact"`) in the activity panel — do not hand-roll inline state JSX.
- `PetState`/sprite rendering must stay pixel-perfect identical to today (same sprite row map, same frame duration) — extraction only, no visual redesign.
