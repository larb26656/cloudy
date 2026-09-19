---
title: Add streaming browser extension chat
slug: add-streaming-browser-extension-chat
id: 20260919-add-streaming-browser-extension-chat
status: ready
created: 2026-09-19
source: planning session 2026-09-19
---

# Plan: Add streaming browser extension chat

## Why

The Chrome side-panel extension currently contains only the WXT Page Reader starter UI, while Cloudy's web app already has a bot chat flow backed by the Cloudy OpenCode proxy. Add a focused chat POC to the extension that always works inside `/Users/luckytime1996/Documents/Work/ask`, persists its latest session, and renders assistant text as OpenCode streams it. The extension must call the Cloudy server at `localhost:4122`, not OpenCode directly.

## Target files

| Path                                                       | Action |
| ---------------------------------------------------------- | ------ |
| `apps/browser-extension/package.json`                      | edit   |
| `apps/browser-extension/wxt.config.ts`                     | edit   |
| `apps/browser-extension/entrypoints/sidepanel/opencode.ts` | create |
| `apps/browser-extension/entrypoints/sidepanel/App.tsx`     | edit   |
| `apps/browser-extension/entrypoints/sidepanel/style.css`   | edit   |
| `apps/browser-extension/entrypoints/sidepanel/App.css`     | edit   |

## Context the new session needs

- This is intentionally a multi-file POC plan. Keep the implementation scoped to the six target files; do not move web-app components or add server routes.
- `apps/browser-extension` is a standalone WXT + React package. Its current side panel at `entrypoints/sidepanel/App.tsx:1` is starter Page Reader code and should be replaced. `entrypoints/background.ts:7` already configures action-click to open the side panel, so it needs no change.
- The fixed OpenCode directory is `/Users/luckytime1996/Documents/Work/ask`. Do not expose a workspace or directory picker, and pass this value to every session and message API call.
- Call `http://localhost:4122/oc` through `@opencode-ai/sdk`, not `http://localhost:4096`. Cloudy mounts the proxy at `/oc` in `packages/server/src/server.ts:57`, and its upstream defaults to OpenCode at port 4096 in `packages/server/src/config/config.ts:31`.
- Cloudy accepts the extension's cross-origin request and preflight. Its CORS middleware permits the OpenCode headers in `packages/server/src/server.ts:27`, while the proxy controller and integration test establish `/oc/*` as the external route in `packages/server/src/features/proxy/proxy.controller.ts:16` and `proxy.integration.test.ts:22`.
- Follow the web app's bot-chat semantics: lazy-create a session with `agent: "bot"`, send with `session.promptAsync`, and abort with `session.abort`. The canonical flow is `apps/web-app/src/components/chat/ChatProvider.tsx:122` and `apps/web-app/src/hooks/queries/useMessages.ts:105`.
- Streaming is received from `oc.global.event()`, as shown in `apps/web-app/src/providers/GlobalEventProvider.tsx:53`. Handle only `message.updated`, `message.part.updated`, `message.part.delta`, `session.status`, `session.idle`, and `session.error`. Preserve deltas that arrive before their corresponding part; the reference behavior is `apps/web-app/src/stores/streamingMessagesStore.ts:69`.
- At `session.idle`, fetch the durable server messages and replace/merge the transient streaming state. The POC displays text parts only; model selection, commands, attachments, tool rendering, permissions, questions, page-reader context, and direct OpenCode access are out of scope.
- The extension currently has no test or lint scripts. Use `compile` and `build` in its `package.json:7` as automated verification, then manually load the unpacked Chrome build for the streaming scenario.

## Tasks

- [x] 1. **Add the OpenCode SDK and extension permissions required to access the Cloudy proxy and persistent session storage.**
  - verify: `pnpm --dir apps/browser-extension compile && pnpm --dir apps/browser-extension build`
  - files: `apps/browser-extension/package.json`, `apps/browser-extension/wxt.config.ts`
- [x] 2. **Create a side-panel OpenCode adapter with constants for the Cloudy proxy URL and the fixed Ask directory.**
  - verify: `pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/entrypoints/sidepanel/opencode.ts`
- [x] 3. **Implement session lifecycle and durable message loading in the side panel, persisting only the latest session ID with `browser.storage.local`.**
  - verify: after reloading the side panel, its first `session.messages` request uses the previously stored session ID and the fixed Ask directory
  - files: `apps/browser-extension/entrypoints/sidepanel/App.tsx`, `apps/browser-extension/entrypoints/sidepanel/opencode.ts`
- [x] 4. **Subscribe to the global SSE stream and assemble transient assistant text messages from message-info, part-update, and part-delta events.**
  - verify: while OpenCode is generating, an assistant text bubble updates before the session reaches `idle`; a delta received before its part appears once the part update arrives
  - files: `apps/browser-extension/entrypoints/sidepanel/App.tsx`, `apps/browser-extension/entrypoints/sidepanel/opencode.ts`
- [x] 5. **Replace the Page Reader UI with a scrollable chat view, composer, generating/error states, and stop generation action.**
  - verify: Enter sends, Shift+Enter inserts a newline, Escape or Stop calls `session.abort`, and only text parts are rendered
  - files: `apps/browser-extension/entrypoints/sidepanel/App.tsx`, `apps/browser-extension/entrypoints/sidepanel/style.css`, `apps/browser-extension/entrypoints/sidepanel/App.css`
- [ ] 6. **Build and exercise the extension against a local Cloudy server.**
  - verify: run `pnpm --dir apps/browser-extension build`, load `.output/chrome-mv3` with Chrome Load unpacked, open the side panel, send a prompt, observe streamed assistant text, close and reopen the panel, and continue the same session
  - files: `apps/browser-extension/package.json`, `apps/browser-extension/wxt.config.ts`, `apps/browser-extension/entrypoints/sidepanel/opencode.ts`, `apps/browser-extension/entrypoints/sidepanel/App.tsx`, `apps/browser-extension/entrypoints/sidepanel/style.css`, `apps/browser-extension/entrypoints/sidepanel/App.css`

## Done when

- [x] The built Chrome extension has permission to call `http://localhost:4122/oc/*` and use extension storage.
- [x] Every OpenCode session, prompt, status, message, and abort call uses `/Users/luckytime1996/Documents/Work/ask` without a selectable directory in the UI.
- [x] The side panel creates or resumes its latest bot session, sends text prompts, and displays persisted user/assistant text messages.
- [x] Assistant text updates from `message.part.delta` before completion, then finalizes from the server message list when the session becomes idle.
- [x] `pnpm --dir apps/browser-extension compile` and `pnpm --dir apps/browser-extension build` exit successfully.

## Notes for implementer

- User approved adding `@opencode-ai/sdk` at the same version range used by `apps/web-app` (`^1.18.13`). Do not add TanStack Query, Zustand, `@repo/ui`, or other web-app dependencies for this POC.
- Keep the existing content script and popup untouched. Page content and selection are explicitly deferred, even though the starter extension currently collects them.
- Do not hard-code the OpenCode upstream port or send direct requests to it. The Cloudy proxy owns that routing and returns suitable CORS headers.
- Do not commit generated `.output/`, `.wxt/`, or other build outputs.
