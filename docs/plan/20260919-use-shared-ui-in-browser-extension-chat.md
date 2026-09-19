---
title: Use shared UI package in browser extension chat
slug: use-shared-ui-in-browser-extension-chat
id: 20260919-use-shared-ui-in-browser-extension-chat
status: ready
created: 2026-09-19
source: planning session 2026-09-19
---

# Plan: Use shared UI package in browser extension chat

## Why

The browser-extension chat currently defines its own message bubbles, buttons,
textarea, colors, typography, and status styling in `entrypoints/sidepanel/App.css` and
`style.css`. Cloudy already owns these patterns in `@repo/ui`, so the extension can drift
from the web app unless it consumes the shared components and theme directly.

Migrate the extension chat to use `@repo/ui` components and styles while preserving the
existing fixed-directory session lifecycle and streaming behavior. The extension should
render OpenCode messages in the same `Message` plus `Part[]` shape expected by the shared
message components rather than flattening them to `{ id, role, text }`.

## Target files

| Path                                                                         | Action                                                                                           |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `apps/browser-extension/package.json`                                        | edit — add `@repo/ui` and Tailwind Vite integration dependencies                                 |
| `apps/browser-extension/wxt.config.ts`                                       | edit — register the Tailwind Vite plugin                                                         |
| `apps/browser-extension/entrypoints/sidepanel/main.tsx`                      | edit — load shared UI globals                                                                    |
| `apps/browser-extension/entrypoints/sidepanel/opencode.ts`                   | edit — preserve full OpenCode messages and parts during durable and streaming assembly           |
| `apps/browser-extension/entrypoints/sidepanel/App.tsx`                       | edit — render shared components and adapt UI state                                               |
| `apps/browser-extension/entrypoints/sidepanel/ExtensionMessageList.tsx`      | create — shared message scroller and thinking state                                              |
| `apps/browser-extension/entrypoints/sidepanel/ExtensionChatInput.tsx`        | create — shared composer shell and keyboard actions                                              |
| `apps/browser-extension/entrypoints/sidepanel/ExtensionSessionStatusBar.tsx` | create — fixed-directory session status footer                                                   |
| `apps/browser-extension/entrypoints/sidepanel/style.css`                     | edit — remove duplicated global control styling and retain only extension-wide layout/base rules |
| `apps/browser-extension/entrypoints/sidepanel/App.css`                       | edit — remove duplicated component styling and retain side-panel layout rules                    |
| `apps/browser-extension/public/sprite/thinking.png`                          | create — shared light thinking sprite asset                                                      |
| `apps/browser-extension/public/sprite/thinking-dark.png`                     | create — shared dark thinking sprite asset                                                       |
| `pnpm-lock.yaml`                                                             | edit — update workspace dependency resolution                                                    |

These files are intentionally coupled: dependency/configuration, message shape, and UI
rendering must change together for the extension to build and display the shared theme.

## Context the new session needs

- Read the root `AGENTS.md` and `apps/web-app/AGENTS.md` before editing. The repository is
  TypeScript strict, ESM-only, and uses `pnpm`; do not add unrelated web-app dependencies.
- `@repo/ui` exports the relevant components through package paths in
  `packages/ui/package.json:7-15`: `@repo/ui/components/message`,
  `@repo/ui/components/button`, `@repo/ui/components/textarea`,
  `@repo/ui/components/error-state`, and `@repo/ui/components/loading-state`.
- `MessageBubble` at `packages/ui/src/components/message/MessageBubble.tsx:5-24` accepts
  the shared `Message` type (`{ info: OpencodeMessage; parts: Part[] }`) and chooses the
  user or assistant presentation. Use this component instead of recreating message
  bubbles in the extension.
- `UserMessageBubble` and `AssistantMessageBubble` at
  `packages/ui/src/components/message/UserMessageBubble.tsx:7-31` and
  `AssistantMessageBubble.tsx:5-21` already handle text-part rendering, spacing, and
  assistant message parts. The POC remains text-only by ensuring the adapter only creates
  or renders text parts; do not add tool, permission, question, or attachment UI.
- Shared tokens and Tailwind v4 setup live in `packages/ui/src/styles/globals.css:1-117`.
  `apps/web-app/src/index.css:1` imports this file. The extension must import the same
  globals and configure `@tailwindcss/vite`, otherwise the shared utility classes and CSS
  variables will not be generated in the WXT build.
- `Button` and `Textarea` are thin shared wrappers at
  `packages/ui/src/components/button.tsx:44-59` and `textarea.tsx:5-15`; use their
  variants/classes rather than raw controls with duplicated visual rules.
- The current adapter constants and API calls are in
  `apps/browser-extension/entrypoints/sidepanel/opencode.ts:7-28`. Preserve
  `CLOUDY_PROXY_URL`, `ASK_DIRECTORY`, `browser.storage.local`, and passing
  `/Users/luckytime1996/Documents/Work/ask` to every session/message/abort request.
- The current stream assembly tracks pending deltas in `StreamState` and applies events
  in `applyStreamEvent` in `opencode.ts`. Retain the delta-before-part behavior, but store
  complete OpenCode `Message` objects and `Part[]` so the shared renderer can consume them.
- Do not use `MessageListView` for this POC. It is an orchestration component with query,
  pagination, session-error context, and minimap requirements (`packages/ui/src/components/message/MessageListView.tsx:21-43`).
  The extension should keep its own simple scroll container and use `MessageBubble` for
  each item.
- The extension has no lint/test scripts. Its required automated checks are
  `pnpm --dir apps/browser-extension compile` and
  `pnpm --dir apps/browser-extension build`; the final UI check is manual Chrome loading.

## Tasks

- [x] 1. Add `@repo/ui` as a workspace dependency and add the Tailwind Vite plugin needed to process shared UI globals in WXT
  - verify: `pnpm install --lockfile-only` completes and the extension package resolves `@repo/ui` from the workspace
  - files: `apps/browser-extension/package.json`, `pnpm-lock.yaml`
- [x] 2. Register Tailwind v4 in the WXT Vite configuration without changing the existing background, popup, or content-script entries
  - verify: `pnpm --dir apps/browser-extension build` emits a side-panel CSS asset without unresolved `@import` or Tailwind errors
  - files: `apps/browser-extension/wxt.config.ts`
- [x] 3. Import `@repo/ui/styles/globals.css` from the side-panel entrypoint and remove conflicting starter global control styles
  - verify: the generated side-panel CSS contains shared token rules such as `--background`, `--primary`, and `--radius`
  - files: `apps/browser-extension/entrypoints/sidepanel/main.tsx`, `apps/browser-extension/entrypoints/sidepanel/style.css`
- [x] 4. Refactor durable and transient adapter state to retain OpenCode `Message` objects with their text `Part[]`, including pending deltas received before a part update
  - verify: `pnpm --dir apps/browser-extension compile` passes and the adapter no longer exposes a flattened `{ id, role, text }` message model to the UI
  - files: `apps/browser-extension/entrypoints/sidepanel/opencode.ts`
- [x] 5. Replace extension-owned message and composer markup with `MessageBubble`, `Button`, `Textarea`, and shared state components while keeping Enter, Shift+Enter, Escape, stop, and error behavior
  - verify: `pnpm --dir apps/browser-extension compile` passes and `App.tsx` imports the shared components instead of defining raw message bubble/control styling
  - files: `apps/browser-extension/entrypoints/sidepanel/App.tsx`, `apps/browser-extension/entrypoints/sidepanel/App.css`
- [x] 6. Remove obsolete duplicated component CSS while preserving only side-panel layout, scroll, header, and composer positioning rules
  - verify: `pnpm --dir apps/browser-extension build` succeeds and no old `.message-user`, `.message-assistant`, or raw `textarea` visual declarations remain in `App.css`/`style.css`
  - files: `apps/browser-extension/entrypoints/sidepanel/App.css`, `apps/browser-extension/entrypoints/sidepanel/style.css`
- [ ] 7. Run the full extension verification and manually compare the side panel with the web-app shared UI in light/dark mode and during streaming
  - verify: `pnpm --dir apps/browser-extension compile && pnpm --dir apps/browser-extension build` passes; Chrome Load unpacked from `.output/chrome-mv3` shows shared-looking user/assistant messages and composer while streamed text updates
  - files: —

## Done when

- [x] The extension imports `@repo/ui/styles/globals.css` and uses Tailwind-generated shared tokens rather than a separate color/radius system.
- [x] User and assistant messages render through `@repo/ui/components/message` using complete OpenCode `Message` and `Part[]` data.
- [x] The composer uses `@repo/ui/components/textarea` and `@repo/ui/components/button`; duplicated raw-control and message-bubble styling is removed.
- [x] Streaming, session persistence, abort behavior, and fixed Ask-directory API calls remain unchanged.
- [ ] `pnpm --dir apps/browser-extension compile` and `pnpm --dir apps/browser-extension build` pass, and the unpacked Chrome extension renders correctly in a manual streaming check.

## Notes for implementer

- Do not add TanStack Query, Zustand, `@repo/contracts`, or other web-app-only dependencies.
- Keep page-reader content scripts and popup behavior untouched.
- Use type-only imports where appropriate and keep ESM imports; do not introduce CommonJS.
- Do not use `MessageListView` unless the scope is explicitly expanded to implement its required orchestration props and contexts.
- Do not commit generated `.output/` or `.wxt/` files.
- This plan spans more than two files because dependency setup, shared CSS processing, message data shape, and rendering are inseparable for this migration; keep the implementation limited to the listed files.
