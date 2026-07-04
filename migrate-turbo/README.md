# Cloudy

AI agent sidekick — chat, ideas, memories, and artifacts. Monorepo with a bundled CLI server and a React frontend.

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 (`npm install -g pnpm`)

## Quick Start (Development)

```sh
pnpm install
pnpm run dev
```

- API server: http://localhost:3000
- Web app: http://localhost:3001

## Build & Install CLI

Build everything and install the `cloudy` command globally on your machine:

```sh
# 1. Build frontend + bundle CLI + copy assets
pnpm build:full

# 2. Create symlink (one-time setup)
pnpm link:cli
```

> **Note:** `link:cli` targets `/usr/local/bin/cloudy` which requires `sudo`. If it fails with `EACCES`, run the printed `sudo ln -sf ...` command manually. Alternatively, a user-writable dir on your `PATH` (e.g. `~/.bun/bin` or `~/.local/bin`) works without sudo.

After that, `cloudy` is available from anywhere:

```sh
cloudy serve --ui
```

This starts the server (API + bundled web UI) at http://localhost:3000. Data is stored at `~/.config/cloudy/data/` by default.

### Rebuilding After Changes

The symlink points to `apps/server/dist/cli.js`, so you only need to rebuild — no re-linking:

```sh
pnpm build:full
```

### CLI Options

```
cloudy serve [options]

Options:
  --ui              Serve the bundled web UI
  --ui-dir <path>   Override UI assets directory (default: ./public next to CLI)
  -h, --host <addr> Host to bind (default: localhost)
  -p, --port <num>  Port number (default: 3000)
  --cors <origins>  Allowed CORS origins, comma-separated
  --config <path>   Config directory (default: ~/.config/cloudy)
  --dataDir <path>  Data directory (default: ~/.config/cloudy/data)
```

## Project Structure

```
apps/
  server/         Cloudy CLI server (Hono, bundled via tsup)
  web-app/        React 19 + Vite frontend
packages/
  contracts/      Shared TypeScript types
  database/       Drizzle ORM + PGlite (WASM Postgres)
  server/         Hono app library (routes, services)
  eslint-config/  Shared ESLint configs
  typescript-config/  Shared tsconfig bases
scripts/
  copy-assets.ts  Copies drizzle migrations + web assets into dist/
  link-cli.ts     Creates the global `cloudy` symlink
  generate-package.ts  Scaffolds new workspace packages
```

## Bundle Architecture

The `cloudy` CLI is bundled into a single file (`apps/server/dist/cli.js`, ~1.4 MB) via tsup:

- **Bundled:** `@repo/server`, `@repo/database`, `hono`, `zod`, `drizzle-orm`, and all other pure-JS dependencies
- **External:** `@electric-sql/pglite` (WASM Postgres — installed as a runtime dependency, resolves its own `.wasm` assets from `node_modules`)
- **Assets in `dist/`:** `drizzle/` (migration SQL), `public/` (web UI)

This keeps the package lean (~3.6 MB tarball) while PGlite handles its own ~16 MB of WASM binaries separately.

## Commands

| Command | Description |
| --- | --- |
| `pnpm run dev` | Dev all apps concurrently |
| `pnpm run dev:server` | Dev server only |
| `pnpm run dev:web-app` | Dev web-app only |
| `pnpm build:full` | Build all + bundle CLI + copy assets |
| `pnpm link:cli` | Install `cloudy` symlink globally |
| `pnpm run lint` | Lint check |
| `pnpm run check-types` | Type check |
| `pnpm run format` | Format with Prettier |
| `pnpm run clean:modules` | Remove all node_modules + lockfile |

## Publishing (Future)

When ready to distribute as an npm package:

1. Remove `"private": true` from `apps/server/package.json`
2. Set the real package name in `"name"`
3. `cd apps/server && npm publish`

The `files: ["dist"]` field ensures only the bundle ships — no source code. `@electric-sql/pglite` is declared as a dependency so npm installs it automatically for users.
