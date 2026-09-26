---
title: Remove OpenCode types from extension UI
slug: remove-opencode-types-from-extension
id: 20260927-remove-opencode-types-from-extension
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Remove OpenCode types from extension UI

## Why

The browser extension still passes OpenCode SDK `Session`, message, and part types into
sidepanel components and tests. This duplicates the web-app coupling and prevents the
shared extension UI from consuming the provider-neutral models already used by the stream
reducer.

Keep SDK types inside the extension's OpenCode client/session/event boundary, then expose
normalized sessions, messages, and parts to sidepanel hooks and components. Preserve
session selection, injected-context detection, streaming display, idle cache merging, and
Cloudy proxy behavior.

## Target files

| Path                                                                                 | Action                       |
| ------------------------------------------------------------------------------------ | ---------------------------- |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/sessions.ts`              | edit                         |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/events.ts`                | edit                         |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/client.ts`                | edit boundary typing         |
| `apps/browser-extension/entrypoints/sidepanel/hooks/useSessions.ts`                  | edit                         |
| `apps/browser-extension/entrypoints/sidepanel/hooks/useSessionMessages.ts`           | edit                         |
| `apps/browser-extension/entrypoints/sidepanel/hooks/useSessionEventStream.ts`        | edit                         |
| `apps/browser-extension/entrypoints/sidepanel/components/SessionPicker.tsx`          | edit                         |
| `apps/browser-extension/entrypoints/sidepanel/components/SessionAppBar.tsx`          | edit                         |
| `apps/browser-extension/entrypoints/sidepanel/components/MessageList.tsx`            | edit                         |
| `apps/browser-extension/entrypoints/sidepanel/components/StreamingMessageBubble.tsx` | edit                         |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/context.ts`               | edit if message type changes |
| `apps/browser-extension/entrypoints/sidepanel/tests/*.test.ts`                       | edit fixtures/types          |

## Context the new session needs

- `apps/browser-extension/entrypoints/sidepanel/lib/opencode/client.ts` must continue using
  the Cloudy `/oc` proxy and directory header. Do not move network calls into components.
- `lib/opencode/sessions.ts` currently imports SDK `Session`; convert its returned data to
  `ChatSession` or a small extension-facing session model before hooks expose it.
- `lib/opencode/events.ts` is already the normalized event boundary after the streaming
  migration. Keep raw `GlobalEvent` handling there and expose `ChatEvent`/stream state only.
- `components/SessionPicker.tsx` and `SessionAppBar.tsx` directly import SDK `Session`;
  their props should use the normalized session model.
- `components/MessageList.tsx` and `StreamingMessageBubble.tsx` should consume the shared
  UI message model from the preceding `@repo/ui` migration. Do not reintroduce SDK-shaped
  `{ info, parts }` data in the extension.
- `lib/opencode/context.ts` and `sessions.ts` contain injected-context behavior that relies
  on text parts. Preserve marker detection and mixed context/prompt handling.
- Extension conventions require the `/oc` proxy, directory propagation, individual Zustand
  selectors, ESM/type-only imports, and `pnpm --dir apps/browser-extension compile` plus
  `build` verification.

## Tasks

- [x] 1. Add or reuse normalized session/domain types and convert SDK session responses at
     the OpenCode session boundary.
  - verify: `pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/entrypoints/sidepanel/lib/opencode/sessions.ts`, `hooks/useSessions.ts`, `components/SessionPicker.tsx`, `components/SessionAppBar.tsx`
- [x] 2. Update message loading, context detection, and idle cache reconciliation to consume
     normalized message/part types while preserving the existing query behavior.
  - verify: `pnpm --dir apps/browser-extension exec vitest run entrypoints/sidepanel/tests/context.test.ts entrypoints/sidepanel/tests/opencode.test.ts`
  - files: `hooks/useSessionMessages.ts`, `hooks/useSessionEventStream.ts`, `lib/opencode/context.ts`, `components/MessageList.tsx`, `components/StreamingMessageBubble.tsx`
- [x] 3. Keep raw SDK types confined to client/event/session adapters and update all extension
     tests and fixtures to use domain types except for adapter boundary tests.
  - verify: `pnpm --dir apps/browser-extension compile && ! grep -R 'from "@opencode-ai/sdk' apps/browser-extension/entrypoints/sidepanel/components apps/browser-extension/entrypoints/sidepanel/hooks apps/browser-extension/entrypoints/sidepanel/stores`
  - files: `lib/opencode/client.ts`, `lib/opencode/events.ts`, `entrypoints/sidepanel/tests/*.test.ts`
- [x] 4. Run the extension's full verification and inspect the remaining SDK imports for
     intentional boundary-only usage.
  - verify: `pnpm --dir apps/browser-extension exec vitest run && pnpm --dir apps/browser-extension compile && pnpm --dir apps/browser-extension build`
  - files: all listed extension targets

## Done when

- [x] Sidepanel components, hooks, stores, and non-boundary tests do not import OpenCode SDK types.
- [x] Session, message, and part props use normalized/shared models, with injected-context and streaming behavior unchanged.
- [x] Extension Vitest tests, compile, build, root lint, and root typecheck pass.

## Notes for implementer

- Never add direct upstream OpenCode connections; retain the Cloudy `/oc` proxy.
- Do not copy the streaming reducer into the extension; use `@repo/opencode`.
- Do not remove generated `.output/`, `.wxt/`, or `.turbo/` artifacts manually as part of
  this migration unless they are untracked build output and need normal cleanup.
