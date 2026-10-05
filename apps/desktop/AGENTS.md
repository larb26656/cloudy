# apps/desktop — AGENTS.md

App-specific guide for the Electron desktop app. Read the **root [`AGENTS.md`](../../AGENTS.md)**
first for repo-wide conventions (TS strict, ESM-only, lint/typecheck workflow).

## What this app is

The native desktop shell for Cloudy. The Electron **main process embeds the cloudy
server** by calling `createServer()` from `@repo/server` — exactly like `apps/server`'s
`cli.ts` does (not a child process, not a remote server). The renderer is the
**web-app, unchanged** (1:1 wrap, no UI fork):

- **Dev**: the window loads `http://localhost:3001` (Vite HMR; override with
  `CLOUDY_DESKTOP_DEV_URL`). Run `pnpm dev:desktop` from the root (boots web-app + desktop).
- **Prod** (packaged): the window loads the embedded server's URL, which serves the
  built web-app same-origin from `dist/public` → zero CORS. See "Packaging" below.

```
src/main.ts       main process: singleton lock → embedded server → main BrowserWindow + lifecycle
src/pet-window.ts desktop pet overlay window: transparent/frameless/always-on-top factory,
                  pet:* IPC handlers (drag, set-size, focus-main, open-session relay,
                  context-menu hide / show / get-visibility),
                  position persistence in userData/pet-window.json
src/preload.ts    parses --cloudy-desktop=<json> + --cloudy-window=<kind> from argv → exposes
                  window.__CLOUDY_DESKTOP__ (incl. windowKind and petBridge)
scripts/rebuild-native.ts   electron-ABI rebuild of THIS app's better-sqlite3 instance (see below)
tsup.config.ts    bundles src/main.ts → dist/main.js (ESM) + copies drizzle migrations
tsup.preload.config.ts      bundles src/preload.ts → dist/preload.cjs (sandboxed preload must be CJS)
electron-builder.yml        release packaging config (asar, asarUnpack, mac dmg/dir targets)
../../scripts/copy-desktop-assets.ts   assembles dist/drizzle + dist/public after tsup
```

If you find yourself adding routes, services, or schema here — **stop**, that belongs in
`packages/server`. UI changes belong in `apps/web-app`. This app is packaging and
lifecycle only.

## Architecture decisions

- **Fixed port with dynamic fallback**: the app probes port **4222** before boot;
  if free, the embedded server binds it so the renderer origin (and thus its
  localStorage) stays stable across launches. If 4222 is busy it falls back to
  `port: 0` (OS-assigned, origin changes per launch). 4222 is deliberately
  distinct from `cloudy serve` (4122) and dev servers (5122) so the CLI and the
  desktop app can run side by side. `createServer().start()` returns the real
  URL; the main process passes it to the renderer via
  `webPreferences.additionalArguments` → preload → `window.__CLOUDY_DESKTOP__.apiUrl`
  (`env.ts` in the web-app picks it up with highest precedence).
- **Single instance**: `app.requestSingleInstanceLock()`; a second launch focuses the
  existing window and exits.
- **Config dir**: dev uses the gitignored `apps/desktop/config`; production uses the
  default `~/.config/cloudy` — **deliberately shared with the CLI** (same DB, same
  workspaces).
- **Security baseline**: `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: true`, `setWindowOpenHandler` → `shell.openExternal` for external links,
  `will-navigate` denied outside app origins (embedded server + dev server).
- **Quit**: `before-quit` destroys the windows (pet first, then main) **then** awaits
  `server.stop()` then `app.exit(0)`. Destroying the windows first is load-bearing: the
  renderers hold SSE/keep-alive connections to the embedded server, and
  `server.close()`'s callback won't fire while they're open (quit would deadlock).
  Shutdown can take a few seconds — the windows disappear immediately, only the dock
  icon lingers.
- **Pet overlay window** (`src/pet-window.ts`, created at boot): transparent,
  frameless, always-on-top (`screen-saver` level), visible on all workspaces, loading
  the web-app's `/pet` route. Same security baseline as the main window. Its lifecycle
  is separate: `activate`/`window-all-closed`/`second-instance` key off `mainWindow`,
  not window counts (the pet would break them). IPC surface (`pet:*` channels) is
  scoped to the pet window's `webContents`; `pet:set-size` keeps the bottom-right
  corner anchored; session rows relay to the main window via `pet:open-session`
  (preload exposes `windowKind` + `petBridge` on `__CLOUDY_DESKTOP__` for both
  windows). Right-clicking the pet opens a native context menu (`pet:context-menu`)
  whose "Hide pet" item hides the overlay; the main window shows a restore button
  driven by `pet:show` / `pet:get-visibility` / `pet:visibility` events (scoped to
  the main window's `webContents`). Position persists to `userData/pet-window.json` — **not** the pet window's
  localStorage: the embedded server normally binds fixed port 4222, but the
  dynamic-port fallback can still change the origin (and thus localStorage)
  on some launches, so the file remains the source of truth.

## The better-sqlite3 ABI trap (read before touching dependencies)

`better-sqlite3` is **not N-API** — an Electron-ABI build differs from a Node-ABI build,
and pnpm shares **one store instance per resolved version** across the workspace:

- The rest of the workspace (`@repo/server`, `apps/server`) resolves `better-sqlite3@11`
  and runs it under **Node**.
- This app pins a **disjoint** version (`better-sqlite3@12`, exact — no caret) so pnpm
  creates a second, isolated store instance that only the desktop uses under **Electron**.

Rules:

1. **Never collapse the ranges.** If `pnpm up`/version bumps make desktop and the rest
   of the workspace resolve the _same_ better-sqlite3 version, the desktop's
   Electron-ABI rebuild would break `cloudy serve` (`NODE_MODULE_VERSION` mismatch).
   Keep desktop on an exact pin one major apart; check with
   `ls node_modules/.pnpm | grep better-sqlite3` (must list two instances).
2. **Never run a repo-wide `electron-rebuild -w better-sqlite3`.** It matches by module
   _name_, walks every dependency (including transitive `@repo/server`), and will
   clobber the shared Node-ABI instance. This actually happened once; `cloudy serve`
   died with a missing-bindings error until the 11.x instance was source-rebuilt.
   Only use `pnpm --filter desktop rebuild:native`, which resolves _this app's_
   instance via `require.resolve("better-sqlite3/package.json")` and compiles it with
   node-gyp against Electron headers (`--dist-url=https://electronjs.org/headers`).
3. **electron-builder must keep `npmRebuild: false`** (set in `electron-builder.yml`).
   Its default npmRebuild walks the pnpm store, finds the workspace-shared 11.x
   instance, deletes its prebuilt binary, and fails to compile it against Electron —
   leaving `cloudy serve` dead ("Could not locate the bindings file"). This happened
   during the first release build; repair is `prebuild-install || node-gyp rebuild`
   inside `node_modules/.pnpm/better-sqlite3@11.*/node_modules/better-sqlite3`, then
   `pnpm --filter desktop rebuild:native` again. The desktop's 12.x instance does not
   need electron-builder's rebuild — `rebuild:native` already made it Electron-ABI and
   it is copied verbatim into the app.
4. After a fresh clone / lockfile change / electron version bump, run
   `pnpm --filter desktop rebuild:native` once. `@lydell/node-pty` is N-API based
   (prebuilt, ABI-stable) — no rebuild needed for it.
5. If `pnpm install` skips Electron's binary download (missing
   `apps/desktop/node_modules/electron/dist`), run
   `node install.js` inside `apps/desktop/node_modules/electron`.

## Dev workflow

```sh
pnpm dev:desktop            # from root: web-app (3001) + Electron window with HMR
pnpm --filter desktop dev   # desktop only (needs web-app dev server on 3001 already)
pnpm --filter desktop build # dist/main.js + dist/preload.cjs + dist/drizzle (+ dist/public if web-app built)
pnpm --filter desktop lint && pnpm --filter desktop check-types
pnpm --filter desktop rebuild:native
```

Main-process changes are picked up by `tsup --watch` but **Electron must be restarted
manually** to reload `dist/main.js`; renderer iteration is unaffected (Vite HMR).

Note: turbo's `dev` task runs every package with a `dev` script, so the root
`pnpm run dev` also opens the Electron window. Use
`turbo run dev --filter=web-app --filter=server` (etc.) to opt out.

## Build pipeline

`build` chains two tsup passes (tsup has no per-entry format):

1. `tsup.config.ts` → `dist/main.js` — ESM, `platform: node`, `target: node20`,
   externals `electron`, `better-sqlite3`, `@lydell/node-pty` (native/binary deps must
   stay as runtime imports; declared as this app's own `dependencies`, mirroring
   `apps/server`). The `createRequire` banner lets the ESM bundle require CJS
   externals. `onSuccess` copies `packages/server/drizzle` → `dist/drizzle` —
   **required**: `runMigrations` resolves `<dirname of bundle>/drizzle` via
   `import.meta.url`, so once `@repo/server` is inlined into `dist/main.js` the SQL
   must live next to it.
2. `tsup.preload.config.ts` → `dist/preload.cjs` — single CJS file (sandboxed
   preloads must be CJS), no clean (would wipe main's output).
3. `scripts/copy-desktop-assets.ts` → assembles the runtime dir: copies
   `packages/server/drizzle` → `dist/drizzle` and `apps/web-app/dist` →
   `dist/public` (skipped with a warning if the web-app isn't built — same UX as
   `scripts/copy-assets.ts`).

A clean `check-types` does not prove a clean bundle — always `pnpm --filter desktop
build` after non-trivial main-process changes.

## Packaging (release builds)

```sh
pnpm build:desktop:release   # from root: build web-app + desktop, then electron-builder
pnpm --filter desktop dist   # electron-builder only (needs dist/ assembled already)
pnpm --filter desktop exec electron-builder build --dir --arm64   # fast unpacked .app
```

Output goes to `apps/desktop/release/` (gitignored): `Cloudy-<version>-arm64.dmg`
plus the unpacked `mac-arm64/Cloudy.app`. Config lives in `electron-builder.yml`.

Runtime layout inside `Cloudy.app/Contents/Resources/`:

```
app.asar                      dist/main.js, dist/preload.cjs, package.json
app.asar.unpacked/dist/drizzle/         migration SQL (real files)
app.asar.unpacked/dist/public/          built web UI (real files)
app.asar.unpacked/node_modules/         better-sqlite3, @lydell/node-pty, ws (real files)
```

Load-bearing details:

- **`asarUnpack`** keeps drizzle + public + better-sqlite3 as real files. The native
  module must be a real `.node` binary, and `src/main.ts` points `publicDir` at
  `app.asar.unpacked/dist/public` (real path, not the asar virtual path).
- **The serveStatic CWD gotcha**: `@repo/server` resolves `publicDir` against
  `process.cwd()` (see `packages/server/src/server.ts`), and a double-clicked macOS
  app has `cwd = /`. `src/main.ts` fixes this app-side (do NOT change `@repo/server`):
  in packaged mode it `process.chdir()`s into `app.asar.unpacked/dist` before
  `createServer`, so hono's relative root resolves to a real directory.
- **`npmRebuild: false`** — mandatory, see ABI-trap rule 3 above.
- **Unsigned local builds**: `identity: "-"` + `hardenedRuntime: false` (ad-hoc
  signing). electron-builder 26 semantics: `identity: null` skips signing entirely,
  `"-"` is ad-hoc. Ad-hoc builds run on the build machine; other Macs will hit a
  Gatekeeper warning (right-click → Open, or `xattr -dr com.apple.quarantine`).
  Real signing/notarization is out of scope.
- First target is `mac.arm64` only (`dmg` + `dir`); x64/Windows/Linux are follow-ups.
- After a release build, re-verify `node apps/server/dist/cli.js serve` still starts
  (proves the Node-ABI better-sqlite3 instance wasn't touched).

## Things that belong elsewhere

| You want to...                                | Go to                                  |
| --------------------------------------------- | -------------------------------------- |
| Add an HTTP route / service / schema          | `packages/server`                      |
| Change how the renderer resolves the API URL  | `apps/web-app/src/config/env.ts`       |
| Change config layering / defaults             | `packages/server/src/config/config.ts` |
| Sign / notarize / auto-update / other targets | out of scope (follow-up plans)         |
| Custom titlebar, tray, deep links             | out of scope for phase 1               |

## Checklist before finishing

1. `pnpm --filter desktop lint && pnpm --filter desktop check-types && pnpm --filter desktop build`
2. `ls node_modules/.pnpm \| grep better-sqlite3` lists **two** instances (11.x + 12.x)
3. Smoke: `pnpm dev:desktop` → window opens, workspaces/chat/terminal/desk work, quit
   releases the port
4. `node apps/server/dist/cli.js serve` still healthy (Node-ABI instance intact)
