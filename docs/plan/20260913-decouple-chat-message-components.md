---
title: Decouple chat message components in web-app
slug: decouple-chat-message-components
id: 20260913-decouple-chat-message-components
status: ready
created: 2026-09-13
source: planning session 2026-09-13
---

# Plan: Decouple chat message components in web-app

## Why

A browser extension is planned next and must render the same chat UI (the reason the
`@repo/ui` package was extracted). The message components under
`apps/web-app/src/components/chat/message/` cannot be moved there yet: they are coupled to
app stores, contain a real import cycle through `SessionViewDialog`, and `MessageList`
mixes data fetching with presentation. This plan decouples them inside web-app — no
package changes — so the follow-up extraction (see
`docs/plan/20260913-extract-message-components-to-repo-ui.md`) becomes a mechanical file
move.

## Target file

All paths under `apps/web-app/src/`. Many files, but one cohesive refactor of the
`components/chat/` tree — single-feature scope.

| Path                                                                                                       | Action                                   |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `components/chat/message/context.ts`                                                                       | create — dialog + settings context seams |
| `components/chat/message/SessionErrorMessage.tsx`                                                          | edit — drop store type import            |
| `components/chat/message/parts/ReasoningPart.tsx` (+ `.stories.tsx`)                                       | edit — drop store read                   |
| `components/chat/message/parts/SubtaskPart.tsx`                                                            | edit — stop rendering SessionViewDialog  |
| `components/chat/message/parts/tool-components/TaskTool.tsx`                                               | edit — same                              |
| `components/chat/message/ThinkingAnimation.tsx`                                                            | edit — asset props                       |
| `components/chat/message/MessageBubble.tsx`                                                                | edit — remove lying props                |
| `components/chat/message/UserMessageBubble.tsx`, `AssistantMessageBubble.tsx`, `parts/CollapsiblePart.tsx` | edit — named exports                     |
| `components/chat/message/MessageListView.tsx`                                                              | create — presentational split            |
| `components/chat/message/useMessageListData.ts`                                                            | create — data orchestration split        |
| `components/chat/message/MessageList.tsx`                                                                  | edit — become thin composition           |
| `components/chat/ChatContainer.tsx`, `BotChatContainer.tsx`                                                | edit/delete — merge into one container   |
| `components/chat/dialogs/SessionViewDialog.tsx`                                                            | edit — host via seam (unchanged API)     |

## Context the new session needs

- **Read `apps/web-app/AGENTS.md` first** — component organization, Zustand selector
  rules, state components (`EmptyState`/`ErrorState`/`LoadingState`), Storybook
  `preview.meta`/`meta.story` pattern, and the test matrix (`.component.test.tsx` runs in
  the jsdom project; `*.stories.tsx` relax `no-explicit-any`).
- **The import cycle to break**: `MessageList.tsx:8` (via barrel) → `MessageParts` →
  `parts/SubtaskPart.tsx:6` and `parts/tool-components/TaskTool.tsx:4` import
  `SessionViewDialog`, which imports `MessageList` back at
  `dialogs/SessionViewDialog.tsx:8`. Both parts render `<SessionViewDialog sessionId
open={dialogOpen} onOpenChange={setDialogOpen}/>` inline (SubtaskPart.tsx:66,
  TaskTool.tsx:35). **Seam design**: a context in
  `components/chat/message/context.ts` exposing
  `{ openSessionView: (sessionId: string, directory?: string) => void }` with a no-op
  default (stories keep working). Parts call it instead of rendering the dialog. The
  containers (`ChatContainer`/`BotChatContainer` or their merged successor) host one `SessionViewDialog`
  instance + implement the callback.
- **Store leaks to remove** (all under `components/chat/message/`):
  - `SessionErrorMessage.tsx:3` imports `SessionErrorInfo` type from
    `@/stores/sessionErrorStore` — define the interface locally (keep it
    shape-compatible).
  - `parts/ReasoningPart.tsx:5,14` reads `useChatSettingsStore((s) => s.autoExpandThinking)`
    — take it from a settings value in the same context file (e.g.
    `MessageSettingsContext` with `autoExpandThinking: boolean`, default `false`),
    provided by `MessageList` which reads the store once. Update
    `ReasoningPart.stories.tsx:3` accordingly.
- **`StreamingMessageBubble` stays store-connected on purpose** — it subscribes to
  `streamingMessagesStore` per-message so `MessageList` doesn't re-render on every token.
  Do NOT de-store it in this plan.
- **`MessageList` today** (259 lines): `useMessages` (:11, :70), `useSessionStatuses`
  (:12, :54), `useStreamingMessagesStore` (:13), `useSessionErrorStore` (:14),
  `pickFresher` dedupe (:15, :109, :139), `max-w-4xl` wrapper (:185). Its 3 consumers
  pass identical props: `ChatContainer.tsx:115`, `BotChatContainer.tsx:105`,
  `SessionViewDialog.tsx:36`. **Keep `MessageList`'s public props signature unchanged**
  — only split its internals into `useMessageListData` (queries/stores/dedupe/pagination)
  - `MessageListView` (pure props: messages, statuses, error rows, callbacks, empty
    state). Visual output must be pixel-identical.
- **Lying props**: `MessageBubble.tsx:8-12` declares `isStreaming`/`onRegenerate` but the
  body (line 14) ignores them — delete the props and update `StreamingMessageBubble`'s
  call site.
- **Export style**: parts are named exports; `UserMessageBubble.tsx:12`,
  `AssistantMessageBubble.tsx`, `ThinkingAnimation.tsx`, `parts/CollapsiblePart.tsx` are
  default exports — convert to named and update every importer (grep
  `from "./UserMessageBubble"` etc., including stories).
- **Container merge**: `ChatContainer.tsx` (160 lines) vs `BotChatContainer.tsx`
  (129 lines) are ~80% identical (same banner overlay, Escape-abort handler,
  `MessageScrollerProvider + MessageList + input` skeleton). Differences: input
  component (`ChatInput` vs `BotChatInput`), `SessionStatusBar`, session picker dialogs,
  minimap props. Merge into one parameterized container (slots/props for input, status
  bar, picker, minimap); `ChatSurface.tsx` keeps its API — it picks the container by
  `workspace.type === "bot"` today and should now just pass a variant flag.
- Conventions: no comments unless asked; `import type` for type-only imports; ESM only;
  never destructure a Zustand store (use selectors); component hierarchy uses named
  function exports.
- `noUncheckedIndexedAccess` is **disabled** in web-app (unlike the server packages).

## Tasks

- [ ] 1. Create `components/chat/message/context.ts` with `SessionViewDialogSeam`
     (`openSessionView(sessionId, directory?) => void`, no-op default) and
     `MessageSettings` (`autoExpandThinking: boolean`, default `false`) contexts;
     rewire `SubtaskPart.tsx` and `tool-components/TaskTool.tsx` to call the seam
     instead of importing/rendering `SessionViewDialog`; mount the provider + one
     `SessionViewDialog` instance in `ChatContainer` and `BotChatContainer`
  - verify: `grep -rn "SessionViewDialog" apps/web-app/src/components/chat/message/`
    returns nothing && `pnpm --filter web-app check-types` passes
  - files: `components/chat/message/context.ts` (new), `parts/SubtaskPart.tsx`,
    `parts/tool-components/TaskTool.tsx`, `ChatContainer.tsx`, `BotChatContainer.tsx`
- [ ] 2. Remove the `@/stores/sessionErrorStore` type import from
     `SessionErrorMessage.tsx` — define `SessionErrorInfo` locally
  - verify: `grep -rn "sessionErrorStore" apps/web-app/src/components/chat/message/`
    matches only `MessageList.tsx`
  - files: `components/chat/message/SessionErrorMessage.tsx`
- [ ] 3. Remove the `chatSettingsStore` read from `ReasoningPart.tsx` — consume
     `MessageSettings` from the context (default `false`); update
     `ReasoningPart.stories.tsx` to wrap with the settings provider instead of mocking
     the store
  - verify: `grep -rn "chatSettingsStore" apps/web-app/src/components/chat/message/`
    matches only `MessageList.tsx`
  - files: `components/chat/message/parts/ReasoningPart.tsx`, `ReasoningPart.stories.tsx`
- [ ] 4. Add `lightSrc`/`darkSrc` props to `ThinkingAnimation.tsx` defaulting to the
     current `/sprite/thinking.png` / `/sprite/thinking-dark.png` constants
  - verify: `pnpm --filter web-app check-types` passes and
    `ThinkingAnimation` still renders in the running Storybook
  - files: `components/chat/message/ThinkingAnimation.tsx`
- [ ] 5. Delete the unused `isStreaming`/`onRegenerate` props from `MessageBubble.tsx`
     and update its call sites
  - verify: `grep -n "isStreaming\|onRegenerate" apps/web-app/src/components/chat/message/MessageBubble.tsx`
    returns nothing && `pnpm --filter web-app check-types` passes
  - files: `components/chat/message/MessageBubble.tsx`,
    `components/chat/message/StreamingMessageBubble.tsx`
- [ ] 6. Convert the four default exports (`UserMessageBubble`,
     `AssistantMessageBubble`, `ThinkingAnimation`, `CollapsiblePart`) to named
     exports and update all importers (components + stories)
  - verify: `grep -rn "export default" apps/web-app/src/components/chat/` returns
    nothing && `pnpm --filter web-app check-types` passes
  - files: the four components + importers
- [ ] 7. Split `MessageList.tsx` into `useMessageListData.ts` (queries, stores,
     `pickFresher` dedupe, streaming eviction, pagination) + `MessageListView.tsx`
     (pure presentational, all data via props); `MessageList.tsx` keeps its exact
     props signature and composes the two; visual output unchanged
  - verify: `pnpm --filter web-app exec vitest run` green &&
    `pnpm --filter web-app check-types` passes
  - files: `components/chat/message/MessageList.tsx` (edit),
    `useMessageListData.ts` (new), `MessageListView.tsx` (new)
- [ ] 8. Merge `ChatContainer` + `BotChatContainer` into a single parameterized
     container (input/status-bar/picker/minimap as slots); delete
     `BotChatContainer.tsx`; `ChatSurface.tsx` API unchanged
  - verify: `test ! -f apps/web-app/src/components/chat/BotChatContainer.tsx` &&
    `pnpm --filter web-app check-types` passes && both chat tab and bot chat render in
    Storybook/dev server
  - files: `components/chat/ChatContainer.tsx`, `BotChatContainer.tsx` (delete),
    `ChatSurface.tsx`

## Done when

- [ ] `grep -rn "@/stores/\|@/hooks/queries/" apps/web-app/src/components/chat/message/parts/`
      returns nothing (parts tree is store- and query-free; only `MessageList.tsx` /
      `useMessageListData.ts` may import them)
- [ ] `grep -rn "SessionViewDialog" apps/web-app/src/components/chat/message/` returns
      nothing (cycle broken)
- [ ] `pnpm --filter web-app lint && pnpm --filter web-app check-types &&
    pnpm --filter web-app exec vitest run` all green
- [ ] `MessageList` consumers (`ChatContainer`, `SessionViewDialog`) required no prop
      changes

## Notes for implementer

- Do tasks in order — each leaves the repo compiling.
- Do NOT de-store `StreamingMessageBubble` (per-token subscription is a deliberate perf
  optimization).
- `MessageListView` must not import anything from `@/stores/`, `@/hooks/`, or app
  containers — it is the piece that moves to `@repo/ui` in the follow-up plan.
- Eyeball the chat tab + desk chat-node + bot chat in `pnpm --filter web-app storybook`
  after tasks 7–8; the merge (task 8) is the riskiest visual change.
- Don't add features (regenerate button, etc.) while in here — this is a pure
  decoupling pass.
