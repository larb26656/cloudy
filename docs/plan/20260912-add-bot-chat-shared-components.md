---
title: Add bot chat shared components
slug: add-bot-chat-shared-components
id: 20260912-add-bot-chat-shared-components
status: ready
created: 2026-09-12
source: planning session 2026-09-12
---

# Plan: Add bot chat shared components

## Why

The web-app has one full-featured chat surface (`ChatContainer`) wired to opencode agents,
but no lightweight variant. We want a simple "bot chat" — message list + bare-bones input,
pinned agent, model selector, no agent selector/attachments/speech/minimap — as shared
components under `src/components/chat/` so a future desk node (`bot-chat-node`) and tab
(`bot-chat`) can both consume them. This round delivers **only** the shared components plus
Storybook stories; node and tab are follow-up plans.

> **Amendment 2026-09-12 (post-review):** the original spec excluded _all_ selectors; the
> maintainer requested a model selector, so `BotChatInput` now embeds `ModelSelector` and
> `BotChatContainer` forwards `model`/`onModelChange` (same pair-or-neither contract as
> `agent`). Agent selector, attachments, speech, quick phrases, and history recall remain
> excluded.

## Target file

| Path                                                                   | Action                       |
| ---------------------------------------------------------------------- | ---------------------------- |
| `apps/web-app/src/components/chat/chat-input/BotChatInput.tsx`         | create                       |
| `apps/web-app/src/components/chat/chat-input/index.ts`                 | edit — export `BotChatInput` |
| `apps/web-app/src/components/chat/BotChatContainer.tsx`                | create                       |
| `apps/web-app/src/components/chat/chat-input/BotChatInput.stories.tsx` | create                       |
| `apps/web-app/src/components/chat/BotChatContainer.stories.tsx`        | create                       |

Five files, one tightly-coupled feature (container + its input + their stories).

## Context the new session needs

- Read `apps/web-app/AGENTS.md` first — especially "Component organization" (why chat UI
  lives in shared `src/components/chat/`), "Styling" (read `DESIGN.md` before any UI), and
  "Storybook" (the `preview.meta(...)` / `meta.story(...)` authoring API).
- **`BotChatContainer` is a stripped copy of `ChatContainer`**
  (`apps/web-app/src/components/chat/ChatContainer.tsx:28`). Keep:
  `ChatProvider` → `MessageScrollerProvider` → `MessageList` + input, plus the
  Question/Permission banners and dialogs (structure at `ChatContainer.tsx:60-159`).
  Drop: `SessionStatusBar`, minimap state/props, `SessionPickerDialog`, and all model
  props. Question/Permission stay because opencode agents genuinely emit them — without
  the UI the bot looks stuck. They render only while an active question/permission exists,
  so they add no visual noise.
- **`ChatProvider` / `useChat()` API** (`apps/web-app/src/components/chat/ChatProvider.tsx:28-50`):
  `sendMessage(content: ChatInputContent, model?, agent?)`, `abortGeneration()`,
  `isSending` / `isStreaming` / `isGenerating`, `directory`, `sessionId`.
  Gotcha: the `agent` prop is only honored in _controlled_ mode — if `onAgentChange` is
  omitted, the provider uses local state and ignores `agent` (`ChatProvider.tsx:95-98`).
  So `BotChatContainer` passes through `agent` + `onAgentChange` as a pair (or neither).
  No model props: `effectiveModel` already falls back to the global default
  (`defaultModelStore`).
- **`ChatInputContent`** = `{ text, mentions, attachments }` from `@/lib/opencode`. The bot
  input always sends `{ text, mentions: [], attachments: [] }`.
- **`MessageList` props**: `selectedSessionId`, `directory`, optional `isShowEmptyState`,
  `minimapOpen`, `onCloseMinimap` — pass only the first two; the empty state default is
  fine for a fresh bot session.
- **Decision — plain `Textarea`, not tiptap**: `BotChatInput` uses the shadcn `Textarea`
  (`@/components/ui/textarea`) instead of `ChatInputEditor`. Bot chat needs no
  mentions/attachments/rich editing; keeping it dependency-free is the point. If mentions
  are wanted later, swap to `ChatInputEditor` (its controlled-value shape is already
  `ChatInputContent`).
- **Behavior spec for `BotChatInput`** (mirror `ChatInput.tsx:32` where relevant):
  - Enter sends, Shift+Enter newline, Escape aborts only while `isStreaming && !text.trim()`.
  - Submit: trim text; no-op when empty or `isSending`; call `scrollToEnd()` from
    `useMessageScroller()` (needs to sit inside `MessageScrollerProvider`), then
    `void sendMessage({ text, mentions: [], attachments: [] }, effectiveModel, effectiveAgent)`
    and clear the field. Passing `effectiveAgent` is what makes a pinned agent work.
  - Send button `ArrowUp`, stop button `Square` while streaming (lucide icons; shadcn
    `Button` `size="icon" className="rounded-full p-4"`), textarea `disabled={isSending}`.
  - Visual: match `ChatInput`'s shell (`rounded-2xl bg-muted border px-4 py-2`) per DESIGN.md.
- **Story pattern**: copy `apps/web-app/src/components/chat/chat-input/ChatInput.stories.tsx`
  — MSW `makeHandlers(status)` hitting `*/oc/session/status`, `*/oc/session/*/prompt_async`,
  `*/oc/session/*/abort` (lines 18-28); a module-level `QueryClient` with
  `staleTime/gcTime: Infinity`; decorators `QueryClientProvider` + `TooltipProvider`;
  `preview.meta` from `@/storybook/preview`. `BotChatInput.stories.tsx` wraps the component
  in `ChatProvider` + `MessageScrollerProvider` exactly like `ChatInputStory`
  (`ChatInput.stories.tsx:37-54`). Stories: `Idle` and `Streaming` (status `busy` → stop
  button). Title hierarchy: `Chat/ChatInput/BotChatInput` and `Chat/BotChatContainer`.
- `BotChatContainer.stories.tsx`: one story, container inside `h-[600px]` frame. Because
  it renders `MessageList`, copy the message-list MSW handlers from
  `apps/web-app/src/components/chat/message/MessageList.stories.tsx` in addition to the
  status/prompt/abort handlers.
- Conventions: ESM only, `import type` for type-only imports (`verbatimModuleSyntax` is
  on), no comments unless asked, individual Zustand selectors only (not needed here —
  BotChatInput reads everything from `useChat()`).

## Tasks

- [x] 1. Create `BotChatInput.tsx` per the behavior spec above and export it from the
     `chat-input` barrel
  - verify: `pnpm --filter web-app check-types` passes
  - files: `apps/web-app/src/components/chat/chat-input/BotChatInput.tsx`,
    `apps/web-app/src/components/chat/chat-input/index.ts`
- [x] 2. Create `BotChatContainer.tsx` as the stripped `ChatContainer` (props:
     `workspace?`, `directory`, `sessionId`, `onSessionChange?`, `agent?`,
     `onAgentChange?`, `model?`, `onModelChange?`, `placeholder?`)
  - verify: `pnpm --filter web-app check-types` passes
  - files: `apps/web-app/src/components/chat/BotChatContainer.tsx`
- [x] 3. Add `BotChatInput.stories.tsx` with `Idle` and `Streaming` stories using the
     MSW/decorator pattern from `ChatInput.stories.tsx`
  - verify: `pnpm --filter web-app exec vitest run --project storybook` passes and both
    stories appear under `Chat/ChatInput/BotChatInput` in `pnpm --filter web-app storybook`
  - files: `apps/web-app/src/components/chat/chat-input/BotChatInput.stories.tsx`
- [x] 4. Add `BotChatContainer.stories.tsx` (single story, `h-[600px]` frame, message-list
     handlers from `MessageList.stories.tsx`)
  - verify: `pnpm --filter web-app exec vitest run --project storybook` passes and the
    story renders list + input together
  - files: `apps/web-app/src/components/chat/BotChatContainer.stories.tsx`
- [x] 5. Full check
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types &&
pnpm --filter web-app exec vitest run` all green
  - files: —

## Done when

- [x] `Chat/ChatInput/BotChatInput` stories render: `Idle` shows textarea + send button;
      `Streaming` swaps to the stop button
- [x] `Chat/BotChatContainer` story renders the message list and bot input composed in a
      600px frame with no `SessionStatusBar`/minimap/session picker
- [x] `pnpm --filter web-app lint && pnpm --filter web-app check-types` clean
- [x] `pnpm --filter web-app exec vitest run` passes (no regressions in existing suites)

## Notes for implementer

- Read `apps/web-app/DESIGN.md` before styling; reuse tokens and mirror `ChatInput`'s
  visual shell — no new design language.
- Out of scope (follow-up plans, don't build now): desk node `bot-chat-node` (skill
  `scaffold-cloudy-desk-node`) and tab type `bot-chat` (skill `scaffold-cloudy-tab`).
- Do not add agent selector, attachments, speech, quick phrases, or input-history
  recall to `BotChatInput` — simplicity is the requirement. (Amended: `ModelSelector` IS
  included per maintainer request; stories mock `*/oc/config/providers` for it.)
  (`ChatProvider.sendMessage` still records history in `chatInputHistoryStore`; that's
  harmless.)
- Lucide icons only (`ArrowUp`, `Square`).
