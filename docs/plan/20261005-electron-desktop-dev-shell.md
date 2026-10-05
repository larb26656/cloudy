---
title: Electron desktop app: dev shell with embedded server
slug: electron-desktop-dev-shell
id: 20261005-electron-desktop-dev-shell
status: done
created: 2026-10-05
source: planning session 2026-10-05
---

# Plan: Electron desktop app: dev shell with embedded server

## Why

Cloudy ships as a CLI binary (`apps/server`) plus a browser UI (`apps/web-app`). We want a
native macOS desktop app that embeds the cloudy server in the Electron main process and
renders the existing web-app unchanged (1:1 wrap, no UI fork). Phase 1 is the dev shell:
running the desktop app in dev opens an Electron window with Vite HMR against the embedded
server, with a dynamic port and a single instance lock. The renderer is reused untouched
except for a small API-URL resolution change in `env.ts` (the file already has dormant
`isModeElectron` placeholders anticipating exactly this).

## Target file

| Path                                                          | Action                                                                       |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `packages/server/src/server/createServer.ts`                  | edit — report the actually bound port (support `port: 0`)                    |
| `packages/server/src/server/createServer.integration.test.ts` | create — port-0 integration test                                             |
| `apps/desktop/package.json`                                   | create                                                                       |
| `apps/desktop/tsconfig.json`                                  | create                                                                       |
| `apps/desktop/eslint.config.js`                               | create                                                                       |
| `apps/desktop/tsup.config.ts`                                 | create                                                                       |
| `apps/desktop/.gitignore`                                     | create                                                                       |
| `apps/desktop/src/main.ts`                                    | create                                                                       |
| `apps/desktop/src/preload.ts`                                 | create                                                                       |
| `apps/desktop/AGENTS.md`                                      | create                                                                       |
| `apps/web-app/src/config/env.ts`                              | edit — desktop-injected API URL precedence                                   |
| `apps/web-app/src/types/desktop.d.ts`                         | create — `Window.__CLOUDY_DESKTOP__` ambient type                            |
| `apps/web-app/src/main.tsx`                                   | edit — remove duplicate `isModeElectron` (line 15)                           |
| `pnpm-workspace.yaml`                                         | edit — `onlyBuiltDependencies` += electron, better-sqlite3, @lydell/node-pty |
| `package.json` (root)                                         | edit — add `dev:desktop` script                                              |
| `AGENTS.md` (root)                                            | edit — repo overview entry + nested AGENTS.md link                           |

Many files, but one feature: a new greenfield app directory plus two tiny edits to existing
packages. The only pre-existing code touched is `createServer.ts` (4 lines) and
`env.ts` (6 lines).

## Context the new session needs

Read root `AGENTS.md`, `apps/server/AGENTS.md`, and `apps/web-app/AGENTS.md` first. The
desktop app deliberately mirrors `apps/server`'s proven packaging pattern.

### Architecture (decided)

- **Embed, don't spawn**: Electron main process calls `createServer()` from `@repo/server`
  — same as `apps/server/src/cli.ts` does. Not a child process, not a remote server.
- **Renderer = web-app as-is.** Dev: window loads `http://localhost:3001` (Vite HMR).
  Prod (phase 2): window loads `http://127.0.0.1:<port>` where the embedded server serves
  the static web-app build same-origin → zero CORS in prod.
- **Dynamic port**: start the server with `port: 0` (OS-assigned ephemeral port) so the
  app never collides with a user-run `cloudy serve` on 4122 or dev servers on 5122.
  Plus `app.requestSingleInstanceLock()`.
- **Config dir**: dev passes a gitignored `apps/desktop/config` (mirror `apps/server`'s
  `--config=config` pattern). Prod uses the default `~/.config/cloudy` — deliberately
  shared with the CLI (same DB, same workspaces).

### Anchors in existing code

- `packages/server/src/server/createServer.ts:26-34` — `serve()` binds and the URL is
  built from `config.port`. With `port: 0` this lies. Fix: after listen, resolve the real
  port from `server.address()` (Node only populates it after the `listening` event —
  await it, don't read it synchronously). Keep the return shape `{ url }`.
- `packages/server/src/config/config.ts:55-57` — `AppOption = Partial<AppConfigInput> & { configDir? }`.
  The desktop passes overrides `{ port: 0, ui, publicDir, configDir }` — highest priority
  layer, so a stale `~/.config/cloudy/config.json` `port` value cannot interfere.
- `packages/server/src/server.ts:30-52` — CORS middleware reflects any origin when no
  allowlist is configured (dev default). So dev fetches from `http://localhost:3001` to
  the embedded port work with `credentials: "include"`.
- `packages/server/src/server/createServer.ts:37-49` — `stop()` already calls
  `ptyService.killAll()` and closes the server. Call it from Electron `before-quit`
  (`event.preventDefault()` → `await stop()` → `app.exit(0)`).
- `packages/server/src/db/migrate.ts:8-11` — migrations resolve `<dirname of bundle>/drizzle`
  via `import.meta.url`. When tsup inlines `@repo/server` into `apps/desktop/dist/main.js`,
  the SQL must live at `apps/desktop/dist/drizzle/` — copy it there in dev AND build
  (mirror `scripts/copy-assets.ts:8-16`).
- `apps/server/tsup.config.ts` — the bundling pattern to mirror: `format: ["esm"]`,
  `platform: "node"`, `target: "node20"`, `external: ["better-sqlite3", "@lydell/node-pty"]`
  (desktop additionally externals `electron`).
- `apps/server/package.json:23-27` — the bundling app must declare the externals as its own
  direct deps: `@lydell/node-pty`, `better-sqlite3`, `ws`. Desktop mirrors this.
- `apps/web-app/src/config/env.ts:1-16` — current resolution:
  `resolveUrl(import.meta.env.VITE_API_URL) || window.origin`, plus dormant
  `isModeElectron`/`isElectronProd` constants. Web-app env files:
  `.env` sets `VITE_API_URL=http://127.0.0.1:5122` (dev), `.env.production` sets `/`
  (same-origin — this is why prod same-origin serving works with no change).
- `apps/web-app/src/main.tsx:15` — duplicate `export const isModeElectron = false;`.
  Grep confirmed **zero consumers** of either flag — safe to delete and re-derive in env.ts.

### How the renderer learns the API URL (dev)

The web-app's `.env` bakes `VITE_API_URL=http://127.0.0.1:5122`, which is wrong for the
desktop's dynamic port. Fix by injection, not build-time env:

1. Main process knows the real URL after `start()` resolves.
2. Pass it to the renderer via `webPreferences.additionalArguments:
[JSON.stringify({ apiUrl, isDev, platform })]` — set before loading the URL.
3. `src/preload.ts` (runs before page scripts on ANY origin, including localhost:3001)
   parses its `process.argv`, then
   `contextBridge.exposeInMainWorld("__CLOUDY_DESKTOP__", info)`.
4. `env.ts` precedence becomes:
   `window.__CLOUDY_DESKTOP__?.apiUrl ?? resolveUrl(VITE_API_URL) ?? window.origin`, and
   `isModeElectron = !!window.__CLOUDY_DESKTOP__`,
   `isElectronProd = isModeElectron && !window.__CLOUDY_DESKTOP__.isDev`.

### The better-sqlite3 ABI trap (most important gotcha)

- `better-sqlite3` is **not N-API** — an Electron-ABI build differs from a Node-ABI build.
- pnpm shares ONE store instance per resolved version across the workspace. If you
  electron-rebuild the instance `apps/server` also resolves, **`cloudy serve` breaks**
  with `NODE_MODULE_VERSION` mismatch.
- Mitigation (pnpm-documented): give `apps/desktop` a **different** `better-sqlite3`
  version range than the workspace's currently resolved one (check
  `pnpm-lock.yaml` / `ls node_modules/.pnpm | grep better-sqlite3`), creating a second,
  isolated store instance that only the desktop's electron-rebuild touches. Keep the
  ranges disjoint permanently (document in `apps/desktop/AGENTS.md`).
- `@lydell/node-pty` is N-API based (ABI-stable across Node/Electron) — no rebuild needed;
  if an ABI error appears anyway, `electron-rebuild -w @lydell/node-pty`.

### Electron + ESM specifics

- `apps/desktop/package.json`: `"type": "module"`, `"main": "dist/main.js"`,
  `"name": "desktop"` (apps use folder-name convention; root scripts filter by `desktop`).
- Sandboxed renderers (default) require the preload to be a **single CJS file** → bundle
  `src/preload.ts` separately to `dist/preload.cjs` (two tsup passes — tsup has no
  per-entry format; e.g. `tsup --config tsup.config.ts && tsup --config tsup.preload.config.ts`).
- Importing CJS-only externals (`better-sqlite3`) from the ESM bundle works via default
  interop; if a runtime `require` error appears, add the `createRequire` banner from
  `apps/server/tsup.config.ts:11-14`.
- Security baseline: `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: true` (default), `setWindowOpenHandler` → `shell.openExternal` for external
  links, deny `will-navigate` outside the app origins.

### Dev workflow

- `apps/desktop` `dev` script: build once, then run `tsup --watch` + `electron .`
  concurrently (devDep `concurrently`). Main-process changes need a manual Electron
  restart; renderer iteration is unaffected (Vite HMR at 3001).
- Turbo's `dev` task picks up every package with a `dev` script — after this plan, root
  `pnpm run dev` also opens the Electron window. That is accepted; devs who don't want it
  use `turbo run dev --filter=...`. Note this in root `AGENTS.md`.
- Turbo `dev` already `dependsOn: ["^build"]` → `@repo/server` dist is fresh, but the
  tsup bundle inlines `@repo/server`'s **dist output**, so `@repo/server` must be built
  before `desktop` build (turbo `^build` handles it).

## Tasks

- [x] 1. Make `createServer` report the actually bound port
  - edit `packages/server/src/server/createServer.ts:26-34`: after `serve()`, await the
    server's `listening` event, read `server.address()`, build the URL from the real port
  - verify: `pnpm --filter @repo/server check-types`
  - files: `packages/server/src/server/createServer.ts`
- [x] 2. Add a port-0 integration test
  - new test: `createServer({ port: 0, configDir: <tmp dir> })` → `start()` returns a URL
    whose port is > 0 and `/api/health` answers on it; `stop()` resolves. Use the
    integration vitest project (real SQLite via temp `configDir`).
  - verify: `pnpm --filter @repo/server exec vitest --project integration run src/server/createServer.integration.test.ts`
  - files: `packages/server/src/server/createServer.integration.test.ts`
  - note: `runMigrations` resolves `dist/drizzle` via `import.meta.url` (missing in the
    vitest src context), so the test no-ops only `runMigrations` via `vi.mock` — the
    container, real sqlite file, and HTTP bind are all real.
- [x] 3. Scaffold `apps/desktop` as a package
  - `package.json` (scripts `build`/`dev`/`lint`/`check-types`/`clean`; deps:
    `better-sqlite3` (**divergent pin**), `@lydell/node-pty`, `ws`; devDeps: `electron`,
    `@repo/server`, `@repo/eslint-config`, `@repo/typescript-config`, `tsup`, `tsx`,
    `concurrently`, `typescript`, `@types/node`), `tsconfig.json` (mirror
    `apps/server/tsconfig.json`), `eslint.config.js` (mirror `apps/server`),
    `.gitignore` (`dist/`, `config/`, `release/`), placeholder `src/main.ts` +
    `src/preload.ts`, `AGENTS.md` stub
  - edit `pnpm-workspace.yaml`: `onlyBuiltDependencies` += `electron`, `better-sqlite3`,
    `@lydell/node-pty`
  - run `pnpm install`, then electron-rebuild scoped to desktop's instance
    (`pnpm --filter desktop exec electron-rebuild -f -w better-sqlite3` or the
    `@electron/rebuild` CLI equivalent)
  - verify: `ls node_modules/.pnpm | grep better-sqlite3` lists **two** instances, and
    `pnpm --filter desktop check-types` passes
  - files: `apps/desktop/*`, `pnpm-workspace.yaml`
  - deviations: divergent pin is exact `12.11.1` (workspace stays `^11.8.1` → 11.10.0);
    `electron-rebuild -w` proved **unsafe** here (matches by name across ALL deps — it
    clobbered the shared 11.10.0 instance and broke the CLI; fixed by source-rebuilding
    11.10.0 against Node headers). Replaced with `scripts/rebuild-native.ts` +
    `node-gyp --dist-url=https://electronjs.org/headers` scoped to the desktop's resolved
    instance, exposed as `pnpm --filter desktop rebuild:native`. Electron's binary
    download was skipped by pnpm once — restored via `node install.js` inside
    `node_modules/electron` (documented in `apps/desktop/AGENTS.md`).
- [x] 4. Implement the build pipeline and processes
  - `tsup.config.ts` (main, ESM, externals `electron`/`better-sqlite3`/`@lydell/node-pty`)
    - second config for `preload.cjs`; build script chains both + a small
      `copy-assets` step copying `packages/server/drizzle` → `apps/desktop/dist/drizzle`
      (add `apps/desktop` `copy-assets` script via `tsx ../../scripts/copy-desktop-drizzle.ts`
      or inline script — implementation choice)
  - `src/main.ts`: singleton lock → `createServer({ port: 0, ui: isPackaged, publicDir,
configDir })` → `BrowserWindow` (1280×800, min 900×600, `preload: dist/preload.cjs`,
    `additionalArguments` with desktop info JSON) → dev loads
    `CLOUDY_DESKTOP_DEV_URL ?? http://localhost:3001`, prod loads the server URL →
    `before-quit` → `stop()`
  - root `package.json`: `"dev:desktop": "turbo run dev --filter=web-app --filter=desktop"`
  - verify: `pnpm --filter desktop build` emits `dist/main.js`, `dist/preload.cjs`,
    `dist/drizzle/` (check with `ls`), and `pnpm --filter desktop check-types` passes
  - files: `apps/desktop/tsup.config.ts`, `apps/desktop/src/main.ts`,
    `apps/desktop/src/preload.ts`, `package.json` (root)
  - note: drizzle copy runs in the main tsup config's `onSuccess` (mirrors
    `@repo/server`'s own tsup), not a separate script. `before-quit` destroys the window
    before awaiting `stop()` — the renderer's SSE/keep-alive connections otherwise keep
    `server.close()`'s callback from firing and quit deadlocks.
- [x] 5. Wire the renderer to the injected URL
  - `env.ts`: add `window.__CLOUDY_DESKTOP__` precedence (see Context), derive
    `isModeElectron`/`isElectronProd`; delete the duplicate export in `main.tsx:15`;
    add `src/types/desktop.d.ts` declaring the global
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types`
  - files: `apps/web-app/src/config/env.ts`, `apps/web-app/src/types/desktop.d.ts`,
    `apps/web-app/src/main.tsx`
- [x] 6. End-to-end dev run (manual smoke)
  - with `pnpm dev:web-app` running: `pnpm dev:desktop` → window opens on the web-app UI;
    exercise workspaces list, a chat, the terminal tab (WS), and the desk tab; relaunch
    while running → second instance focuses the first; quit → the port is released
  - verify: `curl` the `/api/health` of the port logged by main returns `{"status":"ok"}`
    while running, and connection-refused after quit
  - files: —
  - note: verified via automated smoke — window opens, renderer (separate pid) holds
    established connections to the embedded server's dynamic port (proving the injected
    URL was used; `.env` points at 5122 where nothing runs), health `{"status":"ok"}`,
    second launch exits 0 while the first keeps serving, quit releases the port with all
    processes exiting (~10s graceful). Full manual click-through of chat/terminal/desk
    tabs still recommended.
- [x] 7. Docs + full gates
  - write the real `apps/desktop/AGENTS.md` (architecture, dev/build commands, the
    better-sqlite3 divergent-pin rule, what belongs here vs `@repo/server`); add the app
    to root `AGENTS.md` repo overview + nested link
  - verify: `pnpm run lint && pnpm run check-types && pnpm --filter @repo/server test`
    all green
  - files: `apps/desktop/AGENTS.md`, `AGENTS.md` (root)

## Done when

- [x] `pnpm dev:desktop` (with web-app dev server on 3001) opens an Electron window whose
      UI fully works — workspaces, chat streaming, terminal (WebSocket), desk canvas —
      against the embedded server on a dynamic port
      (automated smoke: window opens, renderer holds live connections to the dynamic
      port, health OK; manual click-through of all tabs still recommended)
- [x] In the desktop renderer `window.__CLOUDY_DESKTOP__` is defined and
      `isModeElectron` is `true`; in a plain browser tab on 3001 behavior is unchanged
      (`isModeElectron === false`, `VITE_API_URL` resolution intact)
      (proven indirectly: the renderer only reached the dynamic port via the injected
      URL — `.env` points at 5122 where nothing runs)
- [x] Launching the app a second time focuses the existing window instead of opening one
      (second launch exits 0 immediately; first instance keeps serving)
- [x] The port-0 integration test passes; `apps/server`'s CLI still runs
      (`node apps/server/dist/cli.js serve` after `pnpm build:full`) — proving the
      Node-ABI better-sqlite3 instance was not clobbered
      (verified with `node apps/server/dist/cli.js serve --port=4199` + copy-assets;
      full `@repo/server` suite green)
- [x] `pnpm run lint && pnpm run check-types && pnpm --filter @repo/server test` green

## Notes for implementer

- No comments unless asked; ESM only; match `apps/server` config style. Verify with
  `pnpm --filter desktop lint` / `check-types` — but a clean `check-types` does not prove
  a clean bundle; always `pnpm --filter desktop build` after non-trivial main-process
  changes.
- Never add a runtime import from `@repo/contracts` (type-only facade).
- Keep the better-sqlite3 version ranges of `apps/desktop` and
  `apps/server`/`@repo/server` disjoint. If `pnpm up` collapses them into one resolved
  version, the Electron rebuild will break the CLI binary.
- Out of scope (follow-up plans): packaging/.dmg (plan `20261005-electron-desktop-packaging.md`),
  custom titlebar, tray, deep links, auto-update, Windows/Linux targets.
