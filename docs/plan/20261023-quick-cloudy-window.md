---
title: Quick Cloudy window
slug: quick-cloudy-window
id: 20261023-quick-cloudy-window
status: ready
created: 2026-10-23
source: planning session 2026-10-23
---

# Plan: Quick Cloudy window

## Why

Cloudy desktop currently has a main window and a desktop pet, but no system-wide entry point for asking Cloudy without opening the main window. Add a Spotlight-like floating Quick Cloudy window that can stream a response through Cloudy's existing chat runtime, persist the conversation as a normal session, and open that same session in the main chat UI. The global shortcut is `CommandOrControl+Shift+K` (Cmd+Shift+K on macOS).

## Target file

| Path                                                                      | Action                                                                                                                             |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `apps/desktop/src/main.ts`                                                | edit — initialize Quick Window, shortcut, lifecycle, and window focus/relay integration                                            |
| `apps/desktop/src/quick-window.ts`                                        | create — floating window factory, display positioning, and narrowly scoped IPC handlers                                            |
| `apps/desktop/src/preload.ts`                                             | edit — expose only the Quick Window bridge methods through `contextBridge`                                                         |
| `apps/desktop/AGENTS.md`                                                  | edit — document Quick Window architecture, lifecycle, and IPC surface                                                              |
| `apps/web-app/src/routes/quick.tsx`                                       | create — Quick Cloudy renderer route                                                                                               |
| `apps/web-app/src/routes/__root.tsx`                                      | edit — hide normal app chrome for the Quick route and relay open-session messages                                                  |
| `apps/web-app/src/components/quick-cloudy/QuickCloudy.tsx`                | create — Quick Ask UI and interaction states                                                                                       |
| `apps/web-app/src/components/quick-cloudy/QuickCloudy.component.test.tsx` | create — cover submit, stream, error, and open-in-main interactions                                                                |
| `apps/web-app/src/lib/desktop/quickBridge.ts`                             | create — typed renderer wrapper around the constrained Quick Window bridge                                                         |
| `apps/web-app/src/components/pet/openSessionTab.ts`                       | edit — reuse/extend serializable chat-session tab payload construction                                                             |
| `apps/web-app/src/config/desktop.d.ts`                                    | edit or create — type the Quick Window bridge on `window.__CLOUDY_DESKTOP__` (use the existing declaration location if one exists) |
| `docs/plan/20261023-quick-cloudy-window.md`                               | edit — mark completed tasks and Done when items during implementation                                                              |

## Context the new session needs

- Read the root `AGENTS.md`, `apps/desktop/AGENTS.md`, and `apps/web-app/AGENTS.md` before implementation. The desktop app embeds `@repo/server` in the Electron main process; its renderer is the existing web-app. Do not create another Electron app, agent loop, provider implementation, or server process.
- `apps/desktop/src/main.ts:27-30,52-85,94-123,126-173` owns main-window creation, embedded server boot, singleton behavior, and shutdown. `apps/desktop/src/pet-window.ts:27-36,113-124,279-350` is the established pattern for a second window, origin validation, IPC sender scoping, display work-area positioning, and destruction before server shutdown. Quick Window lifecycle must coexist with the pet window and the existing `mainWindow`-based lifecycle checks.
- `apps/desktop/src/preload.ts:1-34,37-93` parses window metadata and exposes typed APIs via `contextBridge`. Extend this pattern with a `quick` window kind and a narrowly scoped Quick bridge; do not expose `ipcRenderer` or arbitrary channel names to a renderer.
- The Quick renderer can load the same Vite/embedded-server origin as the main renderer, using a dedicated `/quick` route. `apps/desktop/tsup.config.ts` and `tsup.preload.config.ts` currently bundle main and preload entrypoints, while `apps/desktop/package.json` chains those builds. Keep the sandboxed preload as CJS and verify the emitted desktop bundle.
- `packages/server/src/features/cloudy-agent/cloudy-agent.service.ts:13-44,44-118,125-238` already creates Cloudy sessions, persists messages, streams provider deltas, and publishes normalized events. The current chat runtime is the source of truth. Inspect its current implementation and the status of `docs/plan/20261018-cloudy-chat-streaming-runtime.md` before wiring Quick Ask; do not add a parallel chat or streaming implementation.
- Web chat orchestration is in `apps/web-app/src/components/chat/ChatProvider.tsx:117-159,181-250`; session creation and invalidation are in `apps/web-app/src/hooks/queries/useSessions.ts:123-171`; message submission is exposed by `apps/web-app/src/hooks/queries/useMessages.ts`; normalized provider/session API methods are in `apps/web-app/src/lib/cloudy/provider.ts:43-76,97-138`. Reuse these APIs/hooks and the existing event stream/provider stack rather than creating a separate transport.
- The tab relay pattern is in `apps/web-app/src/routes/__root.tsx:19-35`; it listens to the pet bridge and opens chat tabs. `apps/web-app/src/components/pet/openSessionTab.ts:10-30` constructs a serializable chat-tab payload, and `apps/web-app/src/stores/tabStore.ts:15-22,96-114` has `openTab` to focus an already-open session instead of duplicating it. Reuse this flow for Quick Cloudy’s **Open in Cloudy** action.
- The Quick Ask session must be persistent. It uses the configured default model/provider selection and Cloudy provider runtime. When no workspace is selected, create an ephemeral chat session with no workspace identity and use the session’s directory consistently; do not infer or execute local commands. Opening the session in the main window uses the same session ID and directory.
- UI must follow `apps/web-app/DESIGN.md` and web-app conventions: React Query for server state, Zustand only for client state, colocated component tests, shared `LoadingState`/`ErrorState`/`EmptyState` where suitable, and type-only imports for types.
- The requested scope spans multiple packages and more than eight files. Keep the ordered tasks independently verifiable and avoid introducing Phase 3 commands/actions/session-search in this plan.

## Tasks

- [x] 1. **Create the Quick BrowserWindow and register the global shortcut.** Add a hidden frameless always-on-top window loading `/quick`; position it above center on the display nearest the cursor; register `CommandOrControl+Shift+K`; handle failed shortcut registration; and integrate show/hide/destroy behavior with app lifecycle and shutdown.
  - verify: `pnpm --filter desktop lint && pnpm --filter desktop check-types && pnpm --filter desktop build` passes; manual smoke confirms shortcut toggles the window on the active display and `before-quit` destroys it before stopping the server.
  - files: `apps/desktop/src/main.ts`, `apps/desktop/src/quick-window.ts`, `apps/desktop/AGENTS.md`
- [x] 2. **Expose a constrained Quick Window bridge and session relay.** Add `windowKind: "quick"` and typed bridge operations for hiding the window, requesting focus behavior if needed, and relaying a validated chat session payload to the main window; scope handlers to the Quick window’s `webContents`.
  - verify: `pnpm --filter desktop lint && pnpm --filter desktop check-types && pnpm --filter desktop build` passes; inspection confirms Quick renderer APIs expose only named methods and IPC handlers reject messages from non-Quick renderers.
  - files: `apps/desktop/src/preload.ts`, `apps/desktop/src/quick-window.ts`, `apps/desktop/src/main.ts`, `apps/web-app/src/config/desktop.d.ts`, `apps/web-app/src/lib/desktop/quickBridge.ts`
- [x] 3. **Add the dedicated Quick route and Spotlight-style ask UI.** Implement the input, submit behavior, keyboard navigation where applicable, loading/stream/error states, focus-on-show, Escape-to-hide, and an Open in Cloudy control; suppress normal app chrome on `/quick` while retaining required providers.
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types` passes and a component test confirms focus-ready input, Escape bridge invocation, submit states, and error rendering.
  - files: `apps/web-app/src/routes/quick.tsx`, `apps/web-app/src/routes/__root.tsx`, `apps/web-app/src/components/quick-cloudy/QuickCloudy.tsx`, `apps/web-app/src/components/quick-cloudy/QuickCloudy.component.test.tsx`, `apps/web-app/src/lib/desktop/quickBridge.ts`
- [x] 4. **Connect Quick Ask to the existing persistent Cloudy chat APIs.** Create a normal Cloudy session using configured defaults, submit the prompt through the existing chat/session mutation path, and render the normalized stream events using existing providers/stores. Handle provider/model configuration failures and stream failure without creating a second agent/runtime.
  - verify: focused web-app tests prove a Quick Ask creates one persistent Cloudy session, submits the initial prompt once, renders streamed text and errors, and uses existing session/message hooks; `pnpm --filter @repo/server exec vitest run src/providers/cloudy/cloudy.adapter.test.ts` passes.
  - files: `apps/web-app/src/components/quick-cloudy/QuickCloudy.tsx`, `apps/web-app/src/components/quick-cloudy/QuickCloudy.component.test.tsx`, `apps/web-app/src/hooks/queries/useSessions.ts`, `apps/web-app/src/hooks/queries/useMessages.ts`, `packages/server/src/features/cloudy-agent/cloudy-agent.service.ts`
- [x] 5. **Open the same Quick Ask session in the main chat window.** Build a regular chat-tab payload with the existing session ID/provider/directory/workspace identity, relay it through the constrained desktop bridge, and use `openTab` in the main renderer to activate or focus the existing tab.
  - verify: renderer tests assert Open in Cloudy sends the same session ID and main-window handling opens/focuses that session without creating a second session or duplicate chat tab.
  - files: `apps/web-app/src/components/quick-cloudy/QuickCloudy.tsx`, `apps/web-app/src/components/pet/openSessionTab.ts`, `apps/web-app/src/routes/__root.tsx`, `apps/web-app/src/stores/tabStore.ts`, `apps/desktop/src/quick-window.ts`, `apps/desktop/src/main.ts`
- [x] 6. **Run package validation and end-to-end smoke checks.** Run desktop/web-app lint, typecheck, build, and relevant tests; manually verify shortcut, focus, blur/Escape dismissal, streaming, session handoff, main-window-close behavior on macOS, and graceful app quit. (Automated validation complete; interactive Electron smoke check remains.)
  - verify: `pnpm --filter desktop lint && pnpm --filter desktop check-types && pnpm --filter desktop build && pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run src/components/quick-cloudy/QuickCloudy.component.test.tsx` passes; `pnpm --filter @repo/server exec vitest run src/providers/cloudy/cloudy.adapter.test.ts` passes; manual smoke confirms the listed window and session behaviors.
  - files: —

## Done when

- [ ] `CommandOrControl+Shift+K` opens/toggles Quick Cloudy from another application, positions it on the active display, and focuses its input; Escape and blur hide it. (Automated checks pass; desktop smoke check remains.)
- [x] Quick Ask creates a persistent Cloudy session and displays the response streamed through Cloudy’s existing runtime.
- [x] **Open in Cloudy** activates the same session in the main chat UI without creating a new session or duplicate tab.
- [x] IPC stays restricted to the Quick Window’s approved bridge methods; window shutdown destroys Quick Window before stopping the embedded server.
- [x] Desktop and web-app lint/typecheck/build plus focused UI/server tests pass; the desktop `better-sqlite3` divergent-pin rule remains intact.

## Notes for implementer

- This plan intentionally covers a broad cross-package feature. Implement in task order and keep each task buildable/testable before proceeding.
- Check `docs/plan/20261018-cloudy-chat-streaming-runtime.md` before modifying Cloudy agent/runtime files; coordinate with that work and prefer consuming the existing runtime rather than changing it.
- Read `apps/web-app/DESIGN.md` before implementing UI. Run `pnpm --filter web-app design:lint` if design tokens change.
- Main-process changes require restarting Electron after tsup rebuilds. A clean typecheck does not prove the bundle works; run `pnpm --filter desktop build`.
- Preserve desktop security settings (`contextIsolation`, `nodeIntegration: false`, `sandbox: true`, origin guards) and follow every `better-sqlite3` ABI rule in `apps/desktop/AGENTS.md`. Do not run a repo-wide native rebuild.
- Follow repository conventions: ESM, type-only imports, no comments unless asked, and update this plan’s checkboxes as tasks are completed.
