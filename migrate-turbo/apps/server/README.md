# Cloudy Server

The Cloudy CLI server — a bundled Hono application serving the API and optional web UI.

## Build

From the repo root:

```sh
pnpm build:full
```

This produces `dist/` containing:
- `cli.js` — bundled CLI (all workspace packages + deps inlined, ~1.4 MB)
- `drizzle/` — database migration SQL files
- `public/` — web UI assets (copied from `apps/web-app/dist`)

## Run

```sh
# Start server with bundled UI
node dist/cli.js serve --ui

# Or install globally first (from repo root)
pnpm link:cli
cloudy serve --ui
```

## CLI Options

```
cloudy serve [options]

Options:
  --ui              Serve the bundled web UI
  --ui-dir <path>   Override UI assets directory
  -h, --host <addr> Host to bind (default: localhost)
  -p, --port <num>  Port number (default: 3000)
  --cors <origins>  Allowed CORS origins, comma-separated
  --config <path>   Config directory (default: ~/.config/cloudy)
  --dataDir <path>  Data directory (default: ~/.config/cloudy/data)
```

## Development

```sh
pnpm run dev        # server only, hot reload
pnpm run dev:ui     # server + UI (serves from web-app/dist directly)
```
