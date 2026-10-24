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
pnpm publish:local
cloudy serve --ui

# Allow clients on the local network; generate a one-time code from localhost
cloudy serve --ui --host 0.0.0.0
curl -X POST http://127.0.0.1:4122/api/lan/pin

# Headless/trusted network mode: disable pairing explicitly
cloudy serve --host 0.0.0.0 --no-pairing
```

## CLI Options

```
cloudy serve [options]

Options:
  --ui              Serve the bundled web UI
  --ui-dir <path>   Override UI assets directory
  -h, --host <addr> Host to bind (default: localhost)
  -p, --port <num>  Port number (default: 4122)
  --cors <origins>  Allowed CORS origins, comma-separated
  --no-pairing      Allow network clients without device pairing (use only on trusted networks)
  --config <path>   Config directory (default: ~/.config/cloudy)
  --dataDir <path>  Data directory (default: ~/.config/cloudy/data)
```

Pairing is enabled by default. Generate a one-time PIN with the localhost endpoint
shown above; it expires after 60 seconds or when used once. Paired device tokens are
stored as hashes in the Cloudy SQLite database and can be revoked from localhost.
Use `--no-pairing` only when the network is trusted and clients need unauthenticated access.

## Development

```sh
pnpm run dev        # server only, hot reload
pnpm run dev:ui     # server + UI (serves from web-app/dist directly)
```
