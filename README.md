# Cloudy

AI agent sidekick — chat, ideas, memories, and artifacts. Monorepo with a bundled CLI server and a React frontend.

ACP conversation history belongs to the agent. If an agent cannot reload a
saved session, Cloudy keeps the session and indicates that its history is
unavailable. You can still compose a message; if the original session rejects
it, the draft remains in the input and no replacement session is created.
When an agent replays incomplete or reordered history, structural matching
cannot always identify the original messages: duplicates or incorrect merges
may result.

ACP prompts have no fixed deadline: long-running work and permission waits
can continue beyond 30 seconds. Initialization and session creation/loading
retain their timeouts. Use Stop to cancel a running prompt.

Pending ACP permissions are listed by working directory, so returning to an
open conversation still shows its approval requests.
Cloudy's **Once**, **Always**, and **Reject** replies select the agent's offered
`allow_once`, `allow_always`, and `reject_once` options, respectively. If the
agent does not offer the requested kind, Cloudy reports it as unsupported and
keeps the request pending. Stopping or closing the session clears its requests.

ACP agents can ask session-scoped form Questions in chat. Review the fields and
submit an answer, decline, or cancel the Question; closing the sheet only hides
it. Forms are for ordinary non-sensitive information, not credentials. URL
elicitation and forms outside a session are not supported.

Multiple pending Questions remain available independently in their own
conversation, even when they come from the same tool call. Answering one does
not answer another Question or Permission; choose a request from the chat
banner to inspect or answer it. Multi-select fields can be explicitly answered
with no selections; optional fields may also be left unanswered. Automation
continues to wait for human input rather than answering these Questions.

Pending Questions are retired when their prompt ends, the agent withdraws the
request, the session is stopped or closed, or the connection ends. Refreshing
the browser can rediscover a live Question, but restarting the server cannot
restore its response channel. Cloudy does not guess an expiry time: an agent may
silently stop waiting, and delivering a late answer does not guarantee that the
agent used it.

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 (`npm install -g pnpm`)

## Quick Start (Development)

```sh
pnpm install
pnpm run dev
```

- API server: http://localhost:4122
- Web app: http://localhost:3001

The server loads a `.env` file from the current working directory when it starts.
Server configuration environment variables use the `CLOUDY_` prefix, for example:

```sh
CLOUDY_PORT=4122
CLOUDY_OPENCODE_API_BASE=http://localhost:4096
```

Keep API keys and other secrets in `.env`, and do not commit that file.

ACP activity that does not fit the shared chat model appears as a generic
activity card. Its raw provider payload is collapsed by default and can be
expanded for inspection; it may contain sensitive information. Raw activity is
kept only in temporary presentation state, not in a Cloudy-owned transcript.

## Refreshing agent models

The model selector discovers ACP models before starting a conversation. After
changing an agent's configuration, open the selector and choose **Refresh
models**. If refresh fails, the last successfully discovered models remain
available and the selector warns that they may be out of date.

Before each ACP message, Cloudy uses the conversation's model selection, or
the provider's global default when the conversation has no override. The agent
must advertise that model for the session and confirm it is active. If no model
is selected, the model is unavailable, or activation cannot be confirmed,
Cloudy reports the problem without sending the prompt and keeps the draft.
Changing a selection takes effect on the next turn, not during a response.

## Browser Extension Development

The browser extension lives in `apps/browser-extension` and is built with WXT.
It connects to the local Cloudy API, so start the API server before loading the
extension:

```sh
pnpm --dir apps/server dev
```

The extension uses `VITE_API_URL` for the API base URL. To use the default local
extension development server port (`5122`), create
`apps/browser-extension/.env.local` with:

```sh
VITE_API_URL=http://localhost:5122
```

Install dependencies and run the extension in development mode:

```sh
pnpm install
pnpm --dir apps/browser-extension dev
```

### Chrome

For automatic rebuild and extension reload, use:

```sh
pnpm --dir apps/browser-extension dev
```

To load the development build manually:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Run `pnpm --dir apps/browser-extension build` for a production build, or use the dev command above.
4. Click **Load unpacked**.
5. Select `apps/browser-extension/.output/chrome-mv3-dev` for the dev build, or `apps/browser-extension/.output/chrome-mv3` for the production build.
6. Open the extension from the toolbar and test the side panel.

After changing the manifest or permissions, click **Reload** on the extension
card. Inspect the side panel from its DevTools and inspect the background
service worker from the extension card.

### Firefox

For Firefox development with WXT:

```sh
pnpm --dir apps/browser-extension dev:firefox
```

To load the build manually as a temporary add-on:

1. Run `pnpm --dir apps/browser-extension build:firefox`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on**.
4. Select the generated `manifest.json` under `apps/browser-extension/.output/firefox-mv2`.
5. Open the extension and test the side panel.

The temporary add-on is removed when Firefox closes. Use **Reload** in
`about:debugging` after rebuilding. Firefox extension DevTools can be opened
from the add-on entry, and background errors are shown in the Browser Console.

### Extension Commands

Run these commands from the repository root:

| Command                                             | Description                      |
| --------------------------------------------------- | -------------------------------- |
| `pnpm --dir apps/browser-extension dev`             | Start Chrome development mode    |
| `pnpm --dir apps/browser-extension dev:firefox`     | Start Firefox development mode   |
| `pnpm --dir apps/browser-extension compile`         | Type-check the extension         |
| `pnpm --dir apps/browser-extension build`           | Build Chrome production output   |
| `pnpm --dir apps/browser-extension build:firefox`   | Build Firefox output             |
| `pnpm --dir apps/browser-extension exec vitest run` | Run extension tests              |
| `pnpm --dir apps/browser-extension zip`             | Create a Chrome release archive  |
| `pnpm --dir apps/browser-extension zip:firefox`     | Create a Firefox release archive |

Generated `.output/` and `.wxt/` directories are local build artifacts and
should not be committed.

## Build & Install CLI Locally

Build everything and install the `cloudy` command globally on your machine via `pnpm pack` + `pnpm install -g` (simulates a real publish):

```sh
# 1. Build frontend + bundle CLI + copy assets
pnpm build:full

# 2. Pack tarball and install globally
pnpm publish:local
```

This creates a tarball from `apps/server`, installs it into pnpm's global directory, and exposes the `cloudy` command. Runtime dependency `@electric-sql/pglite` is installed automatically alongside.

After that, `cloudy` is available from anywhere:

```sh
cloudy serve --ui
```

This starts the server (API + bundled web UI) at http://localhost:4122. Data is stored at `~/.config/cloudy/data/` by default.

### Uninstall

```sh
pnpm unpublish:local
```

### CLI Options

```
cloudy serve [options]

Options:
  --ui              Serve the bundled web UI
  --ui-dir <path>   Override UI assets directory (default: ./public next to CLI)
  -h, --host <addr> Host to bind (default: localhost)
  -p, --port <num>  Port number (default: 4122)
  --cors <origins>  Allowed CORS origins, comma-separated
  --no-pairing      Allow network clients without device pairing (use only on trusted networks)
  --config <path>   Config directory (default: ~/.config/cloudy)
  --dataDir <path>  Data directory (default: ~/.config/cloudy/data)
```

Pairing is enabled by default. To allow LAN access, bind to `0.0.0.0`; generate a
one-time PIN using the localhost `/api/lan/pin` endpoint. The PIN expires after
60 seconds or when used once. For trusted/headless networks, pass `--no-pairing`.

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
  generate-package.ts  Scaffolds new workspace packages
```

## Bundle Architecture

The `cloudy` CLI is bundled into a single file (`apps/server/dist/cli.js`, ~1.4 MB) via tsup:

- **Bundled:** `@repo/server`, `hono`, `zod`, `drizzle-orm`, and all other pure-JS dependencies
- **External:** `better-sqlite3` (native SQLite — installed as a runtime dependency)
- **Assets in `dist/`:** `drizzle/` (migration SQL), `public/` (web UI)

This keeps the package lean (~3.4 MB tarball) while better-sqlite3 handles SQLite persistence locally.

## Commands

| Command                      | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
| `pnpm run dev`               | Dev all apps concurrently                                         |
| `pnpm --dir apps/server dev` | Dev server only                                                   |
| `pnpm run dev:web-app`       | Dev server + web-app                                              |
| `pnpm dev:desktop`           | Dev web-app + Electron desktop                                    |
| `pnpm build:full`            | Build all + bundle CLI + copy assets                              |
| `pnpm publish:local`         | Pack tarball + install `cloudy` globally (simulates real publish) |
| `pnpm unpublish:local`       | Remove globally installed `cloudy`                                |
| `pnpm run lint`              | Lint check                                                        |
| `pnpm run check-types`       | Type check                                                        |
| `pnpm run format`            | Format with Prettier                                              |
| `pnpm run clean:modules`     | Remove all node_modules + lockfile                                |

## Publishing (Future)

When ready to distribute as an npm package:

1. Remove `"private": true` from `apps/server/package.json`
2. Set the real package name in `"name"`
3. `cd apps/server && npm publish`

The `files: ["dist"]` field ensures only the bundle ships — no source code. `@electric-sql/pglite` is declared as a dependency so npm installs it automatically for users.
