---
title: Migrate Extension Chat Actions to Provider API
slug: extension-provider-chat-actions
id: 20260927-extension-provider-chat-actions
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Migrate Extension Chat Actions to Provider API

## Why

The extension still submits prompts and aborts generation by calling SDK methods through the
legacy `/oc` proxy. Move these mutations to Cloudy's provider routes while preserving the
browser agent, selected model, page/selection context injection, and stop-generation UX.

## Target file

| Path                                                                        | Action                        |
| --------------------------------------------------------------------------- | ----------------------------- |
| `apps/browser-extension/entrypoints/sidepanel/lib/cloudy/provider.ts`       | edit                          |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/sessions.ts`     | edit                          |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/chat-actions.ts` | edit if request shape changes |
| `apps/browser-extension/entrypoints/sidepanel/hooks/useChatActions.ts`      | edit                          |
| `apps/browser-extension/entrypoints/sidepanel/tests/chat-actions.test.ts`   | edit                          |

## Context the new session needs

- The normalized mutation routes are `POST /api/providers/opencode/sessions`,
  `POST /api/providers/opencode/messages`, and
  `POST /api/providers/opencode/sessions/:sessionId/abort`; their schemas are in
  `packages/server/src/features/providers/providers.model.ts:74-102`.
- `apps/web-app/src/lib/cloudy/provider.ts:45-63` shows the route shapes. The extension
  should send `directory` in every request, and message content/attachments/model should use
  normalized names: `content`, `attachments`, `{ providerId, modelId }`, and optional `agentId`.
- Current context assembly in `lib/opencode/chat-actions.ts` intentionally sends multiple
  text entries when page/selection context is new. Preserve the deduplication check and
  marker format; only change the transport callback and payload conversion.
- Current `sessions.ts:89-114` uses SDK `promptAsync` with `agent: "browser"`. The provider
  API may return before completion; generation completion is owned by the SSE plan, not by
  this mutation call.

## Tasks

- [x] 1. Add provider-client helpers for create session, send message, and abort with explicit normalized request types.
  - verify: `pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/entrypoints/sidepanel/lib/cloudy/provider.ts`
- [x] 2. Replace SDK prompt/session/abort calls and map the selected model to provider API fields while retaining browser agent semantics.
  - verify: `pnpm --dir apps/browser-extension exec vitest run entrypoints/sidepanel/tests/chat-actions.test.ts && pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/entrypoints/sidepanel/lib/opencode/sessions.ts`, `apps/browser-extension/entrypoints/sidepanel/hooks/useChatActions.ts`
- [x] 3. Extend tests for context-plus-prompt payload ordering, model propagation, directory propagation, and abort failures.
  - verify: `pnpm --dir apps/browser-extension exec vitest run entrypoints/sidepanel/tests/chat-actions.test.ts`
  - files: `apps/browser-extension/entrypoints/sidepanel/tests/chat-actions.test.ts`, `apps/browser-extension/entrypoints/sidepanel/lib/opencode/chat-actions.ts`

## Done when

- [x] New sessions, prompt submission, and abort use normalized provider routes rather than `/oc` or SDK methods.
- [x] Browser agent, selected model, directory, context deduplication, and error handling behave as before.
- [x] Action tests cover the normalized request contract and pass.

## Notes for implementer

- Keep the current `submitChatMessage` orchestration and keyboard behavior unchanged unless a provider payload requires a boundary-only adjustment.
- Do not connect directly to the OpenCode upstream port.
