---
title: Remove OpenCode types from UI messages
slug: remove-opencode-types-from-ui-message
id: 20260927-remove-opencode-types-from-ui-message
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Remove OpenCode types from UI messages

## Why

The shared message UI package still imports `Part`, `AssistantMessage`, `UserMessage`,
and individual OpenCode part types directly from `@opencode-ai/sdk`. This keeps provider
details in reusable presentational components even though `@repo/ai-core` now owns the
normalized message model.

Move the shared message UI to AI-core message and part types, keeping provider-specific
payload details in `metadata.raw` or in an adapter outside `@repo/ui`. Existing rendering
behavior for text, reasoning, tools, files, diffs, subtasks, compaction, retry, and
snapshot parts must remain unchanged.

## Target files

| Path                                                             | Action                                         |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| `packages/ui/src/components/message/types.ts`                    | edit                                           |
| `packages/ui/src/components/message/MessageBubble.tsx`           | edit                                           |
| `packages/ui/src/components/message/UserMessageBubble.tsx`       | edit                                           |
| `packages/ui/src/components/message/AssistantMessageBubble.tsx`  | edit                                           |
| `packages/ui/src/components/message/MessageParts.tsx`            | edit                                           |
| `packages/ui/src/components/message/MessageError.tsx`            | edit                                           |
| `packages/ui/src/components/message/SessionErrorMessage.tsx`     | edit                                           |
| `packages/ui/src/components/message/MessageListView.tsx`         | edit                                           |
| `packages/ui/src/components/message/parts/*.tsx`                 | edit                                           |
| `packages/ui/src/components/message/parts/tool-components/*.tsx` | edit                                           |
| `packages/ui/src/lib/message-text.ts`                            | edit                                           |
| `packages/ai-core/src/message.ts`                                | edit if a missing normalized field is required |
| `packages/ai-core/src/session.ts`                                | edit if UI status typing needs a shared model  |
| `packages/ui/package.json`                                       | edit if the SDK dependency becomes unused      |
| `packages/ui/src/components/message/**/*.test.ts*`               | edit/create                                    |

## Context the new session needs

- `packages/ui/src/components/message/types.ts:1-21` is the current provider leak: the
  public `Message` shape is `{ info: OpenCodeMessage; parts: Part[] }`.
- `packages/ui/src/components/message/MessageBubble.tsx:8-25` splits rendering by
  `message.info.role`; change this to normalized `message.role` and pass normalized
  `message.parts` downward.
- Every part component under `packages/ui/src/components/message/parts/` currently
  narrows SDK discriminated unions. Replace those narrowings with `MessagePart` union
  members from `@repo/ai-core`; do not recreate a parallel provider DTO union.
- `MessagePart` currently covers text, reasoning, tool, file, diff, subtask, compaction,
  and unknown parts in `packages/ai-core/src/message.ts`. If a UI-only field is genuinely
  required, add it to the AI-core model rather than importing an SDK type.
- OpenCode-only fields needed for display may be read from `part.metadata?.raw`, but this
  should be isolated in a small UI helper and treated as optional. Do not add an SDK
  runtime or type import to `@repo/ai-core`.
- The UI package may continue to use generic `SessionStatus` from AI core. Do not migrate
  API/client integration in this plan.
- Follow `packages/ui` and root conventions: ESM, type-only imports, strict TypeScript,
  no comments unless necessary, and no unrelated formatting/refactors.

## Tasks

- [x] 1. Replace the shared message public types and role/part dispatch with AI-core
     `ChatMessage` and `MessagePart`, preserving the existing component props where possible.
  - verify: `pnpm --filter @repo/ui check-types`
  - files: `packages/ui/src/components/message/types.ts`, `MessageBubble.tsx`, `UserMessageBubble.tsx`, `AssistantMessageBubble.tsx`, `MessageParts.tsx`
- [x] 2. Migrate all message part and tool components to normalized discriminated-union
     members, adding only minimal AI-core fields needed by current rendering behavior.
  - verify: `pnpm --filter @repo/ui lint && pnpm --filter @repo/ui check-types`
  - files: `packages/ui/src/components/message/parts/*.tsx`, `packages/ui/src/components/message/parts/tool-components/*.tsx`, `packages/ui/src/lib/message-text.ts`
- [x] 3. Migrate error/list helpers and replace SDK-shaped message fixtures in shared UI tests
     and stories with normalized fixtures.
  - verify: `pnpm --filter @repo/ui test` or the package's relevant Vitest command, with no `@opencode-ai/sdk` imports under `packages/ui/src/components/message`
  - files: `MessageError.tsx`, `SessionErrorMessage.tsx`, `MessageListView.tsx`, `packages/ui/src/components/message/**/*.test.ts*`
- [x] 4. Remove the UI package's direct SDK dependency only if no remaining source or test
     import requires it, then verify downstream consumers compile.
  - verify: `pnpm --filter @repo/ui check-types && pnpm run check-types`
  - files: `packages/ui/package.json`, `packages/ui/src/components/message/**/*`

## Done when

- [x] `grep` finds no `@opencode-ai/sdk` import under `packages/ui/src/components/message` or `packages/ui/src/lib/message-text.ts`.
- [x] Shared message components accept normalized AI-core message/part types and preserve existing rendering behavior.
- [x] `pnpm --filter @repo/ui lint`, `pnpm --filter @repo/ui check-types`, and relevant UI tests pass.

## Notes for implementer

- Do not change OpenCode adapters or app integration in this plan.
- Keep provider-specific conversion at the OpenCode boundary; `@repo/ui` must not know
  OpenCode field names such as `sessionID`, `messageID`, `callID`, or `state.status`.
- If current UI behavior depends on a field not represented by AI core, document the field
  and extend AI core deliberately instead of using `any`.
