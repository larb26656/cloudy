# @cloudy/server

Elysia-based API server with TypeScript.

## Getting Started

### Installation

```bash
bun install
```

### Development

```bash
bun run cloudy:serve              # Start server
bun run cloudy:serve:ui           # Start server with UI
bun run cloudy:build              # Build for production
```

Open http://localhost:3000/ to see the result.

## CLI

### Link for local testing (without publishing)

```bash
bun run cloudy:link    # Build & link globally
bun run cloudy:unlink # Remove link
```

After linking, you can use the `cloudy` command from anywhere:

```bash
cloudy serve              # Start server
cloudy serve --ui         # Start server with UI
cloudy serve -h localhost -p 3001
```

## Config

Configuration is merged in priority order (lowest → highest):

| Source | Details |
|--------|---------|
| Defaults | Built-in schema defaults |
| `~/.config/cloudy/config.json` | File-stored config |
| `CLOUDY_*` env | Environment variables |
| cli flags | Arguments passed to `loadConfig()` |

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `CLOUDY_CONFIG_DIR` | `~/.config/cloudy` | Config directory |
| `CLOUDY_DATA_DIR` | `~/.config/cloudy/data` | Data storage directory |
| `CLOUDY_HOST` | `localhost` | Server host |
| `CLOUDY_PORT` | `3000` | Server port |
| `CLOUDY_UI` | `false` | Enable UI |
| `CLOUDY_CORS` | _(empty)_ | CORS origins (comma-separated) |
| `CLOUDY_OC_API_BASE_PATH` | `http://localhost:4096` | OpenCode API endpoint |

### Derived Paths (under `dataDir`)

| Path | File/Directory |
|------|----------------|
| Database | `{dataDir}/local.db` |
| Ideas | `{dataDir}/idea/` |
| Memory | `{dataDir}/memory/` |
| Artifact | `{dataDir}/artifact/` |

## Database

```bash
bun run db:migrate                # Run pending migrations
bun run db:migration:create <name> # Create new migration
```