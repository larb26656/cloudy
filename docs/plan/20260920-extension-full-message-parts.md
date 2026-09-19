---
title: Support all message parts in extension
slug: extension-full-message-parts
id: 20260920-extension-full-message-parts
status: ready
created: 2026-09-20
source: planning session 2026-09-20
---

# Plan: Support all message parts in extension

## Why

The browser extension currently filters loaded messages to `text` parts and its stream
assembler ignores every updated part that is not text. The shared `@repo/ui` renderer already
supports the same part types as the web-app, so the extension should preserve and render the
complete OpenCode message model without changing the existing side-panel layout.

## Target file

| Path                                                                    | Action                                                       |
| ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| `apps/browser-extension/entrypoints/sidepanel/opencode.ts`              | edit — preserve all parts and assemble text/reasoning deltas |
| `apps/browser-extension/entrypoints/sidepanel/ExtensionMessageList.tsx` | edit — render complete messages through the shared renderer  |
| `apps/browser-extension/entrypoints/sidepanel/opencode.test.ts`         | create — cover all-part loading and streaming behavior       |

## Context the new session needs

- `opencode.ts:54-68` currently maps `session.messages()` results and filters to
  `part.type === "text"`; remove that lossy transformation and retain `message.parts`.
- `opencode.ts:13-17` types the per-message part map as text-only. The state must track generic
  `Part` values while applying deltas only to delta-capable fields (`text` and `reasoning`).
- `opencode.ts:146-200` currently drops non-text `message.part.updated` events and appends all
  deltas as text. Preserve tool, file, patch, snapshot, subtask, agent, retry, compaction,
  step-start, and step-finish updates as supplied by the SDK.
- `@repo/ui/components/message/MessageParts.tsx:21-76` is the canonical renderer and already
  handles the supported OpenCode part union. Do not duplicate part-specific JSX in the
  extension.
- `MessageBubble` accepts `@repo/ui/components/message/types.Message`, whose `parts` field is
  `Part[]`; the extension can continue using that model.
- The extension must remain a standalone WXT app. Do not import web-app stores, hooks, or
  providers in this plan.

## Tasks

- [x] 1. Change the extension message loading and stream state types to retain every OpenCode `Part`
  - verify: `pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/entrypoints/sidepanel/opencode.ts`
- [x] 2. Update event assembly so non-text part updates are stored and text/reasoning deltas update the matching part without corrupting other part shapes
  - verify: `pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/entrypoints/sidepanel/opencode.ts`
- [x] 3. Keep the message list as a thin adapter around `MessageBubble` and verify every preserved part reaches the shared renderer
  - verify: `pnpm --dir apps/browser-extension build`
  - files: `apps/browser-extension/entrypoints/sidepanel/ExtensionMessageList.tsx`
- [x] 4. Add reducer tests for loaded mixed parts, non-text updates, out-of-order deltas, and text/reasoning deltas
  - verify: `pnpm --dir apps/browser-extension exec vitest run apps/browser-extension/entrypoints/sidepanel/opencode.test.ts` or the repository-supported equivalent passes
  - files: `apps/browser-extension/entrypoints/sidepanel/opencode.test.ts`
- [x] 5. Run the extension checks
  - verify: `pnpm --dir apps/browser-extension compile && pnpm --dir apps/browser-extension build`
  - files: —

## Done when

- [x] Loaded extension messages retain every `Part` returned by OpenCode.
- [x] Streaming updates render text, reasoning, tool, file, patch, snapshot, subtask, agent,
      retry, compaction, and step parts through `@repo/ui` without a text-only filter.
- [x] Out-of-order text/reasoning deltas are not lost.
- [x] Extension compile and build pass.

## Notes for implementer

- Preserve existing uncommitted work in the extension; edit only the behavior required here.
- Keep unknown future part types in the message model so `MessageParts` can show its fallback
  rather than silently dropping them.
- This plan covers rendering and assembly only. Interactive question, permission, and subtask
  actions are follow-up work.
