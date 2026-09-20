# apps/browser-extension — AGENTS.md

App-specific guide for Cloudy's browser extension. Read the root
[`AGENTS.md`](../../AGENTS.md) first for repository-wide TypeScript, ESM, pnpm, and
editing conventions.

## What this app is

The extension is a WXT + React 19 browser extension. It provides a browser side
panel for Cloudy chat, a popup entrypoint, a background service worker, and a
content script. The side panel talks to the Cloudy server and OpenCode through
the Cloudy proxy; it must not connect directly to an OpenCode instance.

## Directory map

```
apps/browser-extension/
  entrypoints/
    background.ts                 background service worker and panel behavior
    content.ts                    page/content-script integration
    popup/                        browser action popup
    sidepanel/                    primary chat UI
      components/                 side-panel UI components
      hooks/                      TanStack Query hooks
      lib/cloudy/                 Cloudy API helpers
      lib/opencode/               SDK client, sessions, and SSE event handling
      queries/                    query-key factories
      stores/                     Zustand stores for chat/session preferences
      tests/                      Vitest tests for extension behavior
      config/env.ts               VITE_API_URL resolution
      main.tsx                    side-panel providers and stylesheet imports
  public/                         extension icons and static assets
  wxt.config.ts                   WXT, Vite, Tailwind, and manifest configuration
```

## Commands

Run from the repository root or from this app with `pnpm --dir`:

```sh
pnpm --dir apps/browser-extension dev
pnpm --dir apps/browser-extension dev:firefox
pnpm --dir apps/browser-extension compile
pnpm --dir apps/browser-extension build
pnpm --dir apps/browser-extension build:firefox
pnpm --dir apps/browser-extension zip
pnpm --dir apps/browser-extension exec vitest run
```

The required automated checks for extension changes are:

```sh
pnpm --dir apps/browser-extension compile
pnpm --dir apps/browser-extension build
```

For changes to chat/session behavior, also run the side-panel Vitest tests.
There is no extension-specific lint script currently; use the repository lint
and typecheck commands when a change affects shared packages.

## Architecture and data flow

- `sidepanel/main.tsx` creates the TanStack Query client, imports the shared
  `@repo/ui` globals, and mounts `App`.
- `App.tsx` coordinates browser workspace initialization, selected sessions,
  durable messages, streaming messages, session lists, and chat actions.
- `lib/cloudy/browser-workspace.ts` is the source for browser workspace status
  and initialization. Do not duplicate workspace creation logic in components.
- `lib/opencode/client.ts` creates the OpenCode SDK client against `${cloudyApiUrl}/oc`
  and sends the directory using `X-OpenCode-Directory`.
- `lib/opencode/sessions.ts` owns session creation, listing, message loading,
  prompt submission, and abort requests.
- `lib/opencode/events.ts` owns the global SSE subscription and delegates stream
  assembly to `@repo/opencode`.
- `@repo/opencode` owns the reusable streaming message state and event reducer;
  keep extension-specific orchestration in the extension rather than copying
  the reducer.
- TanStack Query stores durable server data. Zustand stores small local UI
  state such as the selected session, selected model, generation state, and
  errors. Use individual selectors for Zustand stores.
- Render OpenCode messages using the shared `Message` shape from
  `@repo/ui/components/message/types`; preserve `info` and `parts` instead of
  flattening messages into custom `{ id, role, text }` objects.

## Browser and server configuration

- `VITE_API_URL` controls the Cloudy API base URL. `config/env.ts` provides the
  development default; check it before changing server ports.
- Keep `wxt.config.ts` manifest `host_permissions` aligned with the effective
  `VITE_API_URL` used by the built extension. A mismatch can make the UI build
  successfully while blocking requests in Chrome.
- Keep the `/oc` proxy boundary. Do not add direct requests to the OpenCode
  upstream port, and pass the active browser workspace directory to every
  session, message, prompt, abort, and event request.
- WXT provides the `browser` and entrypoint globals. Do not introduce
  CommonJS, `require`, or a second extension runtime abstraction.

## UI and styling

- Prefer components and tokens from `@repo/ui` over recreating controls,
  message bubbles, loading states, or error states in the extension.
- Keep `@repo/ui/styles/globals.css` imported from the side-panel entrypoint and
  keep the Tailwind Vite plugin registered in `wxt.config.ts`.
- Side-panel layout rules belong in `entrypoints/sidepanel/styles/`; avoid
  adding a second color, typography, or radius system.
- Preserve the existing keyboard behavior: Enter submits, Shift+Enter inserts
  a newline, and Escape/Stop aborts generation where supported by the current
  component.
- Keep popup and content-script behavior independent from side-panel chat
  changes unless the task explicitly includes them.

## Testing and manual verification

- Unit tests should cover stream event ordering, especially deltas received
  before their corresponding part update, durable message conversion, and
  non-text part preservation.
- For UI or manifest changes, build the extension and load
  `apps/browser-extension/.output/chrome-mv3` in Chrome using Load unpacked.
- Verify workspace initialization, session resume, prompt streaming, stop
  generation, error display, and side-panel reopen behavior.
- Do not commit generated `.output/`, `.wxt/`, or `.turbo/` artifacts.

## Change checklist

1. Read the relevant side-panel component, hook, store, or adapter before
   editing it.
2. Keep API calls in `lib/cloudy` or `lib/opencode`, not directly in presentational
   components.
3. Preserve shared OpenCode message and event types; use type-only imports.
4. Run `compile`, `build`, and relevant Vitest tests.
5. If shared package behavior or types changed, run root lint and typecheck.
