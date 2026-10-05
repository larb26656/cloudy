---
title: Electron desktop app: packaging and release build
slug: electron-desktop-packaging
id: 20261005-electron-desktop-packaging
status: ready
created: 2026-10-05
source: planning session 2026-10-05; depends on 20261005-electron-desktop-dev-shell
---

# Plan: Electron desktop app: packaging and release build

## Why

The Electron dev shell exists (plan `20261005-electron-desktop-dev-shell`) but only runs
against the Vite dev server. We need the production path: bundle the web-app's static
build and the drizzle migrations into the Electron app, serve them same-origin from the
embedded server, and produce a launchable macOS `.app` + `.dmg` via electron-builder —
no code signing, no auto-update (local builds only).

## Target file

| Path                                | Action                                            |
| ----------------------------------- | ------------------------------------------------- |
| `scripts/copy-desktop-assets.ts`    | create — assemble `apps/desktop/dist` runtime dir |
| `apps/desktop/src/main.ts`          | edit — production URL / publicDir resolution      |
| `apps/desktop/electron-builder.yml` | create                                            |
| `apps/desktop/package.json`         | edit — `dist` release script                      |
| `package.json` (root)               | edit — `build:desktop:release` script             |
| `apps/desktop/AGENTS.md`            | edit — packaging section                          |
| `AGENTS.md` (root)                  | edit — build-command table mention                |

## Context the new session needs

Read `apps/server/AGENTS.md` ("Build & bundling", "Build outputs") and the dev-shell
plan's `apps/desktop/AGENTS.md` first. This plan mirrors the existing
`web-app dist → apps/server/dist/public` pipeline for the desktop.

### Runtime layout being assembled

```
apps/desktop/dist/
  main.js          ← tsup (inlines @repo/server; externals electron + natives)
  preload.cjs      ← tsup (CJS)
  drizzle/         ← copied from packages/server/drizzle  (migrations resolve via
                     import.meta.url — see packages/server/src/db/migrate.ts:8-11)
  public/          ← copied from apps/web-app/dist          (static web UI)
```

Prod mode: `createServer({ ui: true, publicDir: dist/public })`, window loads
`http://127.0.0.1:<dynamic port>` — same-origin, so the web-app's
`.env.production` `VITE_API_URL=/` resolution works unchanged. The preload-injected
`window.__CLOUDY_DESKTOP__.apiUrl` (already implemented in the dev-shell plan) remains
the explicit source of truth in both modes.

### Gotcha: serveStatic is CWD-relative

`packages/server/src/server.ts:97-101` does
`relative(process.cwd(), publicDir)` then `serveStatic({ root: relRoot })` — hono's
serve-static resolves the root against `process.cwd()`. A double-clicked macOS app has
`cwd = /`, so static serving silently breaks in the packaged app. Fix inside
`apps/desktop/src/main.ts` (do NOT change `@repo/server`): in packaged mode, either
`process.chdir()` into the directory containing `dist/` before `createServer`, or pass
`publicDir` such that the relative resolution lands correctly. Verify with a real
packaged run — `--dir` unpacked builds must also work.

Plan B if serve-static fights harder: `win.loadFile(dist/public/index.html)` and rely on
the preload-injected `apiUrl` (dev-shell plan already wired `env.ts` precedence, and a
`file:` origin has no `window.origin` API fallback — the injection is required then;
CORS: file origins send `Origin: null`, and `packages/server/src/server.ts:36-40` reflects
any non-empty origin when no allowlist is configured, so it works).

### electron-builder + pnpm facts

- `apps/desktop` prod deps are only the externals: `better-sqlite3` (divergent pin —
  see dev-shell plan), `@lydell/node-pty`, `ws`. electron-builder packs those into the
  app; everything else is inlined in `dist/main.js`.
- electron-builder's default `npmRebuild` rebuilds better-sqlite3 **inside the packaged
  node_modules copy** (real files, not symlinks) — it must NOT touch the workspace
  store. After a release build, re-verify `apps/server`'s CLI still runs (Node-ABI
  instance intact).
- `@lydell/node-pty` is N-API — ABI-stable, no rebuild expected.
- Keep `files: ["dist/**"]`; `asar: true` with
  `asarUnpack: ["**/dist/drizzle/**", "**/dist/public/**", "**/node_modules/better-sqlite3/**"]`
  (native module + file-reading paths stay real files).
- macOS unsigned: `identity: null` (ad-hoc). Gatekeeper will warn on other machines —
  expected for local builds; signing/notarization is out of scope.
- First target: `mac.arm64` (`dmg` + `dir`). x64/Windows/Linux are follow-ups.

### Pipeline wiring

- `scripts/copy-desktop-assets.ts`: copy `scripts/copy-assets.ts` and retarget —
  drizzle → `apps/desktop/dist/drizzle` (error if desktop dist missing), web-app dist →
  `apps/desktop/dist/public` (skip with warning if not built, same UX as
  `scripts/copy-assets.ts:38-44`).
- `apps/desktop` `build` script chains: tsup main → tsup preload → copy-desktop-assets.
  Turbo `build` outputs already include `dist/**` (`turbo.json`), no turbo change needed.
- Root script:
  `"build:desktop:release": "turbo run build --filter=web-app --filter=desktop && pnpm --filter desktop dist"`
  where desktop `dist` = `electron-builder build --mac`.
- `apps/desktop/release/` is gitignored (added in the dev-shell plan's `.gitignore`).

## Tasks

- [x] 1. Create `scripts/copy-desktop-assets.ts` and chain it into the desktop build
  - verify: `pnpm build:web-app && pnpm --filter desktop build` then
    `test -f apps/desktop/dist/public/index.html && ls apps/desktop/dist/drizzle/*.sql`
    succeeds
  - files: `scripts/copy-desktop-assets.ts`, `apps/desktop/package.json`
- [x] 2. Fix production URL/publicDir resolution in `src/main.ts`
  - packaged mode serves the UI same-origin from `dist/public` (see CWD gotcha above);
    dev mode unchanged (localhost:3001)
  - verify: `pnpm --filter desktop build && pnpm --filter desktop exec electron-builder build --dir`
    → launch `release/mac-arm64/Cloudy.app` (or the `mac` dir name electron-builder uses)
    → the web UI renders and DevTools network tab shows same-origin API calls
  - files: `apps/desktop/src/main.ts`
- [x] 3. Add `electron-builder.yml` + release scripts
  - config per Context (appId `com.cloudy.desktop`, productName `Cloudy`, files, asarUnpack,
    mac dmg + dir, arm64, `identity: null`); desktop `dist` script; root
    `build:desktop:release`
  - verify: `pnpm build:desktop:release` produces `apps/desktop/release/*.dmg` and an
    unpacked `.app` under `apps/desktop/release/`
  - files: `apps/desktop/electron-builder.yml`, `apps/desktop/package.json`,
    `package.json` (root)
- [ ] 4. Packaged smoke test (manual checklist)
  - install/launch the dmg app with NO dev servers running: workspaces list loads,
    a chat sends + streams (SSE), files tab reads a directory, terminal tab spawns a
    shell (WS), desk canvas renders; quit and relaunch → same data persists
    (`~/.config/cloudy` shared with CLI); after all this, `node apps/server/dist/cli.js
serve` still starts (Node-ABI better-sqlite3 instance untouched)
  - verify: all checklist items pass; `curl http://127.0.0.1:<logged port>/api/health`
    from the app's console output returns ok while running
  - files: —
- [x] 5. Docs + gates
  - `apps/desktop/AGENTS.md`: packaging section (runtime layout, release commands,
    asarUnpack rationale, unsigned/Gatekeeper note, pin-divergence rule); root
    `AGENTS.md`: add `build:desktop:release` to build commands
  - verify: `pnpm run lint && pnpm run check-types` green
  - files: `apps/desktop/AGENTS.md`, `AGENTS.md` (root)

## Done when

- [x] The unpacked packaged app (`--dir` output) launches offline and the full UI works
      — chat streaming, terminal WS, desk, files — served same-origin from the embedded
      server
- [x] `pnpm build:desktop:release` produces an installable `.dmg`
- [x] No `NODE_MODULE_VERSION` / better-sqlite3 ABI errors in the packaged app, and
      `apps/server`'s CLI still runs after a release build
- [x] `pnpm run lint - [ ] `pnpm run lint && pnpm run check-types`green- [ ]`pnpm run lint && pnpm run check-types` green pnpm run check-types` green

## Notes for implementer

- A clean `check-types` does not prove the bundle; always smoke-run the built app after
  touching `src/main.ts`.
- Keep the better-sqlite3 divergent-pin rule (dev-shell plan) — packaging is where a
  collapsed pin silently corrupts the CLI's native module.
- If static serving fails inside asar despite `asarUnpack`, switch to the plan-B
  `loadFile` path described in Context — `env.ts` already supports it.
- Out of scope: code signing, notarization, auto-update (electron-updater), universal
  binary, Windows/Linux targets — follow-up plans.
