---
title: Desktop pet overlay - Electron window
slug: desktop-pet-overlay-electron
id: 20261005-desktop-pet-overlay-electron
status: ready
created: 2026-10-05
source: planning session 2026-10-05
requires: 20261005-desktop-pet-overlay-webapp
---

# Plan: Desktop pet overlay - Electron window

## Why

The cloudy desktop app is a single BrowserWindow; the floating pet can only appear inside it. We want a second, transparent, frameless, always-on-top window that loads the web-app's `/pet` route so the pet floats on the desktop outside the main window. This plan is the **Electron half**; it requires the web-app half (`20261005-desktop-pet-overlay-webapp`) to be merged first — it depends on that plan's `/pet` route, `petBridge` API shape, and the `windowKind`/`DesktopInfo` extension.

## Target file

| Path                             | Action |
| -------------------------------- | ------ |
| `apps/desktop/src/pet-window.ts` | create |
| `apps/desktop/src/preload.ts`    | edit   |
| `apps/desktop/src/main.ts`       | edit   |
| `apps/desktop/AGENTS.md`         | edit   |

## Context the new session needs

- **Read `apps/desktop/AGENTS.md` first** — especially the better-sqlite3 ABI trap
  rules. This plan touches **zero dependencies**; do not run any electron-rebuild
  command.
- **Current main process** (`src/main.ts`): `createWindow()` (lines 31-70) builds
  the main BrowserWindow with `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: true`, and passes `--cloudy-desktop=<json>` via
  `webPreferences.additionalArguments` (42-48). Navigation security:
  `setWindowOpenHandler` → `shell.openExternal` (55-58) and `will-navigate`
  guarded by `isAppOrigin` (60-62, 19-29). Lifecycle: `activate` re-creates a
  window when `BrowserWindow.getAllWindows().length === 0` (101-103),
  `window-all-closed` quits on non-darwin (105-107), `before-quit` destroys the
  main window then awaits `server.stop()` (109-122), `second-instance` focuses
  the main window (95-99).
- **Lifecycle bugs this plan must fix** (a pet window breaks the window-count
  assumptions):
  - `activate` (101-103): with the pet window alive, `getAllWindows().length` is
    ≥1, so the macOS dock icon would no longer re-open the main window. Change to
    `if (!mainWindow) void createWindow()`.
  - `window-all-closed` (105-107): same count problem on future non-mac targets —
    key off `mainWindow === null` instead of counting windows.
  - `before-quit` (109-122): also `destroy()` the pet window before stopping the
    server (an always-on-top window surviving quit would be a zombie overlay).
  - `second-instance` (95-99): restore/focus the main window, creating it if
    `mainWindow === null`.
- **Preload pattern** (`src/preload.ts:3-24`): it parses `--cloudy-desktop=` from
  `process.argv` and exposes `window.__CLOUDY_DESKTOP__` via `contextBridge`.
  Extend: also parse `--cloudy-window=<kind>` and include it as `windowKind` in
  the exposed info (both windows get it). When `windowKind === "pet"`, additionally
  expose a `petBridge` implementing the web-app plan's shape
  (`dragStart/dragMove/dragEnd/setSize/focusMain/openSession/onOpenSession`) over
  `ipcRenderer.send`/`ipcRenderer.on`. Sandboxed preloads may use `ipcRenderer`.
  Keep the file CJS-compatible (bundled by `tsup.preload.config.ts`).
- **Pet window factory** (`src/pet-window.ts` — new module imported by `main.ts`;
  `tsup.config.ts` bundles from the single `src/main.ts` entry so no config
  change is needed, but verify with a build):
  - `new BrowserWindow({ frame: false, transparent: true, resizable: false,
hasShadow: false, skipTaskbar: true, roundedCorners: false, show: false,
backgroundColor: "#00000000", width/height to match the overlay's collapsed
size (~144×160), webPreferences: same security baseline + same preload +
additionalArguments: ["--cloudy-desktop=<json>", "--cloudy-window=pet"] })`,
    `ready-to-show` → `show()`.
  - macOS prominence: `setAlwaysOnTop(true, "screen-saver")` and
    `setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })` right after
    create. Non-mac: these calls are harmless no-ops/ignored.
  - Apply the same `setWindowOpenHandler`/`will-navigate` guards as the main
    window (`isAppOrigin` must be exported or re-derived — it depends on
    `serverUrl`/`isDev`, so pass them into the factory).
  - Load `` `${isDev ? DEV_SERVER_URL : serverUrl}/pet` `` — dev gets Vite HMR in
    the overlay for free.
- **IPC handlers** (registered in `pet-window.ts`, scoped to the pet
  `webContents`):
  - `pet:drag-start` — capture `screen.getCursorScreenPoint()` and the window's
    current position; store offset in module state.
  - `pet:drag-move` — `win.setPosition(cursor.x - offset.x, cursor.y - offset.y)`
    (re-read cursor each event; DPI-safe, no zoom math).
  - `pet:drag-end` — clear offset + persist position (below).
  - `pet:set-size` `{ width, height }` — keep the **bottom-right corner anchored**
    when the overlay expands its activity panel: compute
    `{ x: oldX + oldW - w, y: oldY + oldH - h }`, then `setBounds`. Clamp so the
    window stays on a visible display (`screen.getDisplayMatching`).
  - `pet:focus-main` — ensure `mainWindow` exists (create if null), then
    `restore()` + `focus()`. The factory needs a callback into `main.ts` for
    window creation — pass `ensureMainWindow: () => Promise<void>`.
  - `pet:open-session` `{ type, data }` — ensure main window, focus it, then
    `mainWindow.webContents.send("pet:open-session", payload)`; the web-app's
    `__root.tsx` relay (from the web-app plan) opens the tab. Preload's
    `onOpenSession(cb)` subscribes on the main window side (expose it for BOTH
    window kinds, not just pet).
- **Position persistence — do NOT use the pet window's localStorage**: prod loads
  from the embedded server on `port: 0`, so the origin changes every launch and
  localStorage would be silently partitioned away. Persist `{x, y}` to
  `join(app.getPath("userData"), "pet-window.json")` via `node:fs` (read on
  create, write debounced on drag-end/quit), clamped to
  `screen.getDisplayMatching(...).workArea` so a disconnected monitor doesn't
  strand the pet off-screen.
- **Phase 1 decisions** (from the web-app plan, honored here): no
  `setIgnoreMouseEvents` / click-through; no tray/menu toggle yet — the pet
  window is always created at boot.
- **AGENTS.md**: `apps/desktop/AGENTS.md` describes `src/main.ts` as the
  "entire main process" — update the file map to include `pet-window.ts` and add
  a short bullet under Architecture decisions (pet window, IPC surface,
  position persistence, the localStorage-gotcha).

## Tasks

- [x] 1. **Extend `preload.ts`**: parse `--cloudy-window=`, expose `windowKind` on `__CLOUDY_DESKTOP__` for all windows, and expose `petBridge` when `windowKind === "pet"` (plus `onOpenSession` for all Electron windows).
  - verify: `pnpm --filter desktop lint && pnpm --filter desktop check-types`
  - files: `apps/desktop/src/preload.ts`
- [x] 2. **Create `pet-window.ts`**: window factory (transparent/frameless/always-on-top/all-workspaces), navigation guards, IPC handlers (drag, set-size with bottom-right anchor, focus-main, open-session relay), userData JSON position persistence with display clamping.
  - verify: `pnpm --filter desktop check-types && pnpm --filter desktop build`
  - files: `apps/desktop/src/pet-window.ts`
- [x] 3. **Wire into `main.ts`**: create the pet window after the main window in `boot()`; fix `activate`/`window-all-closed`/`second-instance` to key off `mainWindow` instead of window counts; destroy the pet window in `before-quit`.
  - verify: `pnpm --filter desktop lint && pnpm --filter desktop check-types && pnpm --filter desktop build`
  - files: `apps/desktop/src/main.ts`
- [x] 4. **Update `apps/desktop/AGENTS.md`** file map + architecture notes for the pet window.
  - verify: `grep -c "pet-window" apps/desktop/AGENTS.md` returns ≥ 1
  - files: `apps/desktop/AGENTS.md`
- [ ] 5. **Manual smoke with dev servers** (needs the web-app plan merged): `pnpm dev:desktop` → pet floats over the desktop and other apps; drag works; panel expands up-left and collapses; clicking a session row opens/focuses the chat tab in the main window; closing the main window leaves the pet; dock icon re-opens the main window; quit leaves no overlay behind.
  - verify: all six behaviors observed in one `pnpm dev:desktop` session
  - files: —

## Done when

- [x] `pnpm --filter desktop lint && pnpm --filter desktop check-types && pnpm --filter desktop build` all pass, and `ls node_modules/.pnpm | grep better-sqlite3` still lists two instances (nothing was rebuilt).
- [ ] With `pnpm dev:desktop`: the pet is visible over other applications, survives main-window close, the dock reopens the main window, and app quit removes the overlay window completely.
- [ ] Dragging the pet moves it; its position is restored after full app restart; it stays on-screen when the saved display is gone.
- [ ] Clicking a waiting/working session in the overlay's panel opens (or focuses) the corresponding chat tab in the main window.
- [x] `node apps/server/dist/cli.js serve` still starts (Node-ABI better-sqlite3 untouched).

## Notes for implementer

- Do not touch dependencies or run `electron-rebuild` — this plan adds none. Respect every ABI-trap rule in `apps/desktop/AGENTS.md`.
- `check-types` clean does not prove the bundle works — the task-2/3 verifies include `pnpm --filter desktop build` for that reason.
- Keep the security baseline identical on the pet window: `contextIsolation`, `sandbox`, no `nodeIntegration`, `setWindowOpenHandler` → external, `will-navigate` guarded by `isAppOrigin`.
- Main-process changes are NOT hot-reloaded into a running Electron — restart Electron after `tsup --watch` rebuilds when smoke-testing.
