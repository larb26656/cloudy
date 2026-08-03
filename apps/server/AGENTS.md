# apps/server — AGENTS.md

App-specific guide. Read the **root [`AGENTS.md`](../../AGENTS.md)** first for repo-wide
conventions (TS strict, ESM-only, Zod-first DTOs, lint/typecheck workflow).

## What this app is

`apps/server` is the **distributable CLI binary** for Cloudy. It contains *no business logic*
of its own — it is a thin commander.js wrapper that parses CLI flags and hands them to
`@repo/server`'s `createServer(...)`. Its job is packaging: take the Hono app library plus
its migrations and (optionally) the built web UI, and bundle them into a single
`cloudy` binary users can `pnpm publish:local` and run.

```
src/cli.ts        ← the ENTIRE app. One file. ~80 lines.
config/config.json  default host/port used by `pnpm dev`
tsup.config.ts    bundler config — produces dist/cli.js
```

If you find yourself adding routes, services, repositories, schema, or validation here,
**stop** — that work belongs in `packages/server`. This app should
almost never grow.

## Mental model: request flow

```
user runs `cloudy serve --ui`
        │
        ▼
src/cli.ts  ──► loadConfig({ configDir, ui, host, port, cors, publicDir })  ← from @repo/server
        │           (merges schema defaults + config.json + env + overrides)
        ▼
        └─► createServer(config)  ← resolved CloudyConfig only
        │
        ▼
Hono app starts on http://<host>:<port>
   ├── /api/<feature>   ← @repo/server route sub-apps
   ├── /api/health
   ├── /api/oc/*        ← opencode proxy
   ├── /openapi, /docs  ← generated API docs
   └── /*               ← static UI assets from publicDir (only when --ui)
```

## CLI surface

Defined in `src/cli.ts`. Currently a single subcommand:

| Command | Purpose |
| --- | --- |
| `cloudy serve` | Start the Hono server. All flags below belong to it. |

`serve` flags (forwarded 1:1 into `loadConfig({ ... })` as the highest-priority `overrides` layer — keep them in sync):

| Flag | Maps to | Notes |
| --- | --- | --- |
| `--ui` | `ui` | Serve static UI from `publicDir` |
| `--ui-dir <path>` | `publicDir` | Defaults to `./public` next to `cli.js`; computed in cli.ts, then passed via overrides |
| `-h, --host <address>` | `host` | Default `localhost` |
| `-p, --port <num>` | `port` | Default `4122` |
| `--cors <origins>` | `cors` | Comma-separated; split + trimmed in cli.ts |
| `--config <path>` | `configDir` | Default `~/.config/cloudy` |
| `--dataDir <path>` | _no-op_ | Currently unforwarded; reserved. |

When adding a flag: (1) add `.option(...)` to the commander chain, (2) add it to the
`serveCommand` options type, (3) forward it into the `loadConfig({...})` call as an
override key that matches the `CloudyConfig` field name, (4) update this table and
`README.md`. Do **not** parse the flag's value beyond what `cli.ts` already does
(string splitting for `--cors`, `Number.parseInt` for `--port`) — all deeper
validation lives in `@repo/server`'s Zod schema.

## Dev modes (note the non-default ports)

`pnpm dev` and `pnpm dev:ui` use port **5122**, not the production 4122, so a dev server
can run alongside a published `cloudy` binary without clashing. The web-app's
`VITE_API_URL` points at 4122, so for full-stack dev prefer the root `pnpm run dev`
(which boots `apps/web-app` on 3001 and `@repo/server` directly on 4122) instead of
this app's `dev` script.

| Script | What it runs | Port | UI? |
| --- | --- | --- | --- |
| `pnpm dev` | `tsx watch src/cli.ts serve` | 5122 | no |
| `pnpm dev:ui` | same + `--ui --ui-dir ../../apps/web-app/dist` | 5122 | yes (must `build` web-app first) |
| `pnpm start` | `node dist/cli.js` | 4122 | whatever flags you pass |

## Build & bundling

`pnpm build` runs `tsup` against `tsup.config.ts`. The config has three load-bearing
details — understand them before touching it:

1. **`entry: ["src/cli.ts"]`** + **`format: ["esm"]`** + **`platform: "node"`** — produces a
   single self-contained `dist/cli.js` (~1.4 MB). All workspace packages
   (`@repo/server`, `@repo/contracts`) and most npm deps are **inlined**.
2. **`external: ["better-sqlite3"]`** — better-sqlite3 (native SQLite) cannot be bundled by
   tsup; it must remain a real `require`/`import` at runtime. This is why the banner injects
   `createRequire` (see #3). If you add another native/WASM dep, you almost certainly need
   to `external` it too.
3. **Banner:** prepends `#!/usr/bin/env node` (makes the file executable) and a
   `createRequire(import.meta.url)` shim so the ESM bundle can still `require()` Node-only
   packages that don't ship ESM.

After `tsup` finishes, run `pnpm copy-assets` (or the root `pnpm build:full`) to assemble
the runtime directory:

```
apps/server/dist/
   cli.js            ← tsup output (the binary entry, `bin.cloudy`)
   drizzle/          ← copied from packages/server/drizzle  (migration SQL)
   public/           ← copied from apps/web-app/dist          (web UI assets, only if built)
```

`copy-assets` is idempotent — it `rm -rf`s the target subdirs before copying. It will skip
`public/` with a warning if `apps/web-app/dist` doesn't exist yet; it will **error** if
`apps/server/dist` doesn't exist (run `pnpm build` first).

## Config file

`config/config.json` is a tiny default for local dev:

```json
{ "host": "localhost", "port": "4122" }
```

`cli.ts` does **not** read this file directly — it exists for the dev scripts
(`--config=config`). The actual config/file-loading happens inside
`@repo/server`'s `loadConfig`, which `cli.ts` calls before `createServer`.

## TypeScript

Extends `@repo/typescript-config/base.json`. `outDir: dist`, `types: ["node"]`. The
`check-types` script (`tsc --noEmit`) only typechecks `src/` — runtime behavior is governed
by tsup, not tsc, so a clean `check-types` does not guarantee a clean bundle. Always run
`pnpm build` after non-trivial changes.

## Things that belong elsewhere

| You want to... | Go to |
| --- | --- |
| Add an HTTP route | `packages/server/src/features/<feature>/index.ts` |
| Add a DB table / migration | `packages/server/src/db/schema/*.ts` + `db:generate` |
| Change how config is loaded | `packages/server/src/config/config.ts` (`loadConfig` / `parseConfig`) |
| Change the OpenAPI docs wiring | `packages/server/src/server.ts` |
| Change the web UI | `apps/web-app/` |
| Change the binary's flags / banner / bundle | you're in the right place |

## Checklist before finishing

1. `pnpm --filter server lint && pnpm --filter server check-types`
2. `pnpm build` (then inspect `dist/cli.js` size — sudden jumps usually mean a dep stopped
   being `external` and got inlined)
3. Smoke-test: `node dist/cli.js serve --ui` and hit `http://localhost:4122/api/health`
4. If you added/changed a flag, update both this file's CLI table **and** `README.md`.
