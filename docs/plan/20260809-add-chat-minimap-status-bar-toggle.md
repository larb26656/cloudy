---
title: Add chat minimap with status bar toggle
slug: add-chat-minimap-status-bar-toggle
id: 20260809-add-chat-minimap-status-bar-toggle
status: ready
created: 2026-08-09
source: planning session 2026-08-09
---

# Plan: Add chat minimap with status bar toggle

## Why

The chat surface has no way to jump to a specific user/assistant message in a long
conversation — users must scroll blindly. A `ChatMinimap.tsx` already exists in the repo
but is **dead code** (not imported anywhere) and was written against an old scroll
architecture (`scrollRef` + `querySelector`) that no longer matches the
`@shadcn/react/message-scroller` primitive now in use. We want to revive the feature by
rewriting it on top of the primitive's hooks, mounting it inside the chat container with
`position: absolute` (confined to the chat, not the whole viewport), and exposing a toggle
button in the bottom `SessionStatusBar` (IDE-style status bar action).

## Target file

| Path                                                            | Action              |
| --------------------------------------------------------------- | ------------------- |
| `apps/web-app/src/components/chat/ChatMinimap.tsx`              | edit (full rewrite) |
| `apps/web-app/src/components/chat/message/MessageList.tsx`      | edit                |
| `apps/web-app/src/components/chat/ChatContainer.tsx`            | edit                |
| `apps/web-app/src/components/chat/SessionStatusBar.tsx`         | edit                |
| `apps/web-app/src/components/chat/SessionStatusBar.stories.tsx` | edit                |

## Context the new session needs

### Architecture in play

The chat UI is shared between the `chat` tab and the `chat-node` desk node, so everything
lives under `apps/web-app/src/components/chat/` (see `apps/web-app/AGENTS.md` → "Component
organization"). The relevant component tree today:

```
ChatContainer  (apps/web-app/src/components/chat/ChatContainer.tsx)
  └── <div relative flex-1 flex flex-col overflow-hidden h-full>   ← positioning root (line 76)
      ├── <div absolute z-50 top-0 ... justify-end>                 ← QuestionBanner / PermissionBanner (line 81)
      ├── <MessageScrollerProvider autoScroll>                       ← line 100
      │     ├── <MessageList>                                        ← has messages + renders the scroller
      │     │     └── <div relative flex-1 min-h-0>                  ← MessageList.tsx:175
      │     │           └── <MessageScroller>
      │     │                 ├── <MessageScrollerViewport>          ← the actual scroll element
      │     │                 │     └── <MessageScrollerContent>
      │     │                 │           └── <MessageScrollerItem messageId=…>   ← renders data-message-id attr
      │     │                 └── <MessageScrollerButton>            ← scroll-to-end (bottom-right floating)
      │     └── <ChatInput>
      └── <SessionStatusBar>                                          ← directory + token usage, bottom row (line 106)
```

### The `@shadcn/react/message-scroller` primitive

This is the load-bearing piece. The old `ChatMinimap.tsx` is broken against it because it
expected a `scrollRef: RefObject<HTMLDivElement>` and ran its own `querySelector` +
`IntersectionObserver`. The primitive now owns all of that. Verified facts (read the
.d.ts at `node_modules/.pnpm/@shadcn+react@0.2.1_*/node_modules/@shadcn/react/dist/message-scroller/index.d.ts`
and the bundle source):

- **`MessageScrollerItem`** renders `<div data-message-id={messageId} data-scroll-anchor={...}>`.
  So message elements are queryable by `[data-message-id="..."]` automatically — no manual
  attribute plumbing needed.
- **`scrollAnchor`** prop on `MessageScrollerItem` is set to `true` only for **user**
  messages — see `MessageList.tsx:198-201`:
  ```tsx
  scrollAnchor={item.kind === "remote" && item.message.info.role === "user"}
  ```
- **`useMessageScroller()`** returns `{ scrollToEnd, scrollToMessage, scrollToStart }`.
  `scrollToMessage(id, { align, behavior, scrollMargin })` does everything — no manual
  `scrollIntoView` needed.
- **`useMessageScrollerVisibility()`** returns `{ currentAnchorId, visibleMessageIds }`:
  - `currentAnchorId` is the topmost **`scrollAnchor`-flagged** (i.e. user) message near
    the viewport top. **It is `null` when no user message is in/near view.**
  - `visibleMessageIds: string[]` is the full list of currently-visible message ids of any
    role (the primitive uses an internal `IntersectionObserver` with
    `rootMargin: "${-(scrollMargin+peek)}px 0px 0px 0px"`).
  - The hook is **deduped via `useSyncExternalStore`** — safe to call from any child of
    `MessageScrollerProvider`; it won't re-render on every scroll tickle, only on real
    change.
- Both hooks throw if called outside a `MessageScrollerProvider`. **Therefore `ChatMinimap`
  must render inside `MessageScrollerProvider`** — which means inside `MessageList`'s
  parent `<MessageScrollerProvider>` (already in `ChatContainer.tsx:100`).

### Where messages live

`Message[]` is fetched inside `MessageList.tsx` via the `useMessages` hook
(`MessageList.tsx:57-68`) and exposed as `remoteMessages` (`MessageList.tsx:70`). The
merged streaming/remote list is `displayItems` (`MessageList.tsx:91-119`). **Pass
`remoteMessages` to `ChatMinimap`** — that's the canonical persisted list, and minimap
previews don't need streaming-freshness (a still-streaming assistant message will appear
once persisted).

### Decisions already made (from the planning session)

1. **Toggle position**: in `SessionStatusBar`, rightmost (next to token usage). Treat it
   like an IDE status bar action.
2. **Panel positioning**: `position: absolute` inside the chat container root (not `fixed`
   over the viewport). The container root `<div className="relative flex-1 flex flex-col
overflow-hidden h-full">` at `ChatContainer.tsx:76-80` is the positioning ancestor.
3. **Scope**: rewrite `ChatMinimap.tsx` from scratch on top of the primitive's hooks. Do
   **not** preserve the old `scrollRef` API.

### Conventions to respect (from `apps/web-app/AGENTS.md`)

- **State components**: never hand-roll inline empty/error/loading JSX. Use
  `EmptyState` / `ErrorState` / `LoadingState` from `@/components/ui/*-state`. For the
  minimap "no messages / no search matches" case, use
  `<EmptyState size="inline" title="..." />`.
- **`memo`**: chat components that re-render on streaming ticks are wrapped in `memo`
  (see `MessageList`, `ChatInput`, `SessionStatusBar`). Do the same for `ChatMinimap` and
  use `useMemo` for the items list so a parent re-render doesn't thrash it.
- **Zustand selectors**: never destructure a whole store. (Not relevant here unless you
  add a `minimapOpen` store — see "State shape" below.)
- **Icons**: `lucide-react` only. `data-icon` attr is a project convention for sizing
  inline icons.
- **No comments unless asked.**
- **Tooltip**: the status bar already wraps clickable affordances in `Tooltip` (see the
  token-usage triggers in `SessionStatusBar.tsx:140-150`). Match that pattern.

### State shape decision

`minimapOpen` lives in `ChatContainer` as `useState(false)` (no persistence — ephemeral UI
preference, like `questionOpen`/`permissionOpen` already in `ChatContainer.tsx:48-49`).
It's threaded down as props:

- `ChatContainer → SessionStatusBar`: `minimapOpen`, `onToggleMinimap`
- `ChatContainer → MessageList`: `minimapOpen`, `onCloseMinimap`

This avoids a new Zustand store for a single boolean and matches how
`questionOpen`/`permissionOpen` are already managed locally.

## Tasks

- [ ] 1. **Rewrite `ChatMinimap.tsx` from scratch on top of the primitive's hooks.**
  - Signature: `ChatMinimap({ messages, onClose }: { messages: Message[]; onClose: () => void })`.
    Drop the old `scrollRef` and `isVisible` props — visibility is now controlled by the
    parent conditionally rendering the component.
  - Inside, call `useMessageScroller()` for `scrollToMessage` and
    `useMessageScrollerVisibility()` for `{ currentAnchorId, visibleMessageIds }`.
  - Build items via `useMemo` from `messages`: `{ id, role, preview, partTypes }`. The
    `extractPreview` logic from the old file (lines 22-70) is fine to keep — it walks
    `message.parts` to build a ≤50-char preview and falls back to `[reasoning]` /
    `[tool call]` / `[file]` / etc. by part type. **Drop the `textContent` search-index
    field** (see task 3 for search).
  - Search box: keep the `useState<string>` search input. Filter items by `preview`
    substring (case-insensitive). No need to pre-compute a `textContent` index — preview
    substring matches the user's intent and avoids double-walking parts.
  - Active highlight: an item is "active" if its `id === currentAnchorId` (primary signal
    for the user message that anchors the current view) OR `visibleMessageIds.includes(id)`
    (covers assistant items currently in view). Guard against `currentAnchorId === null`
    gracefully — no item highlighted, not a crash.
  - Click handler: `scrollToMessage(item.id, { align: "center", behavior: "smooth" })`.
  - Container: `<div className="absolute right-2 top-2 bottom-2 w-56 … flex flex-col z-40
bg-background/95 backdrop-blur border rounded-lg shadow-xl">`. Note `top-2 bottom-2`
    instead of the old fixed `h-[calc(100vh-10rem)]` — keeps it inside the chat container
    regardless of viewport. Reuse the existing header (title + close button) and search
    row from the old file (lines 158-216) — just drop the `onClose`-disabled guard since
    `onClose` is now always provided.
  - Wrap the component in `memo`.
  - verify: `pnpm --filter web-app check-types` compiles. Then
    `rg "useMessageScroller|useMessageScrollerVisibility" apps/web-app/src/components/chat/ChatMinimap.tsx`
    shows both hooks in use, and `rg "scrollRef" apps/web-app/src/components/chat/ChatMinimap.tsx`
    returns nothing.
  - files: `apps/web-app/src/components/chat/ChatMinimap.tsx`

- [ ] 2. **Render `ChatMinimap` from inside `MessageList` (so it has provider context).**
  - `MessageList` already owns `remoteMessages` (`MessageList.tsx:70`) and is rendered
    inside `MessageScrollerProvider` (provider is in `ChatContainer.tsx:100`). Perfect
    host.
  - Add props to `MessageListProps`: `minimapOpen?: boolean` (default `false`),
    `onCloseMinimap?: () => void`.
  - In the success branch (the `<div className="relative flex-1 min-h-0">` return at
    `MessageList.tsx:175`), render the minimap as a sibling of `<MessageScroller>`:
    ```tsx
    {
      minimapOpen && onCloseMinimap && remoteMessages.length > 0 && (
        <ChatMinimap messages={remoteMessages} onClose={onCloseMinimap} />
      );
    }
    ```
    The `relative flex-1 min-h-0` parent is the positioning ancestor — panel's `absolute`
    will be confined to the message area (won't cover ChatInput or SessionStatusBar, which
    sit outside MessageList).
  - Import `ChatMinimap` from `../ChatMinimap`.
  - **Do not** render the minimap in the loading / error / empty early-return branches
    (`MessageList.tsx:143-172`) — there's nothing to outline.
  - verify: `pnpm --filter web-app check-types` compiles;
    `rg "ChatMinimap" apps/web-app/src/components/chat/message/MessageList.tsx` shows
    both the import and the render site.
  - files: `apps/web-app/src/components/chat/message/MessageList.tsx`

- [ ] 3. **Add `minimapOpen` state to `ChatContainer` and thread it through.**
  - In `ChatContainerContent` (`ChatContainer.tsx:47`), add `const [minimapOpen,
setMinimapOpen] = useState(false);` next to `questionOpen`/`permissionOpen`
    (line 48-49).
  - Pass to `MessageList` (line 101):
    `minimapOpen={minimapOpen}` and `onCloseMinimap={() => setMinimapOpen(false)}`.
  - Pass to `SessionStatusBar` (line 106-110): `minimapOpen={minimapOpen}` and
    `onToggleMinimap={() => setMinimapOpen((v) => !v)}`.
  - verify: `pnpm --filter web-app check-types` compiles;
    `rg "minimapOpen" apps/web-app/src/components/chat/ChatContainer.tsx` shows 4+
    occurrences (state decl + 2 prop passes + setter).
  - files: `apps/web-app/src/components/chat/ChatContainer.tsx`

- [ ] 4. **Add the toggle button to `SessionStatusBar`.**
  - Extend `SessionStatusBarProps` with `minimapOpen?: boolean` and
    `onToggleMinimap?: () => void` (both optional so existing stories/call sites don't
    break — see `SessionStatusBar.stories.tsx`).
  - Pick a `lucide-react` icon that reads as "outline / table of contents": `ListTree`
    or `PanelRight`. Use `ListTree` (matches "outline" semantics; `PanelRight` implies
    dock-right which we're not doing).
  - Render the button in **both** the wide layout (`@[40rem]:flex` block,
    `SessionStatusBar.tsx:118-204`) and the narrow layout (`@[40rem]:hidden` block,
    `SessionStatusBar.tsx:207-238`). Place it **after the token block, rightmost** in
    each layout — mirrors how IDE status bars keep view toggles at the far right. Wrap
    in a `Tooltip` like the token triggers:
    ```tsx
    {
      onToggleMinimap && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleMinimap}
              data-active={minimapOpen ? "true" : undefined}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                minimapOpen && "text-foreground",
              )}
            >
              <ListTree className="size-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle chat outline</TooltipContent>
        </Tooltip>
      );
    }
    ```
  - verify: `pnpm --filter web-app check-types` compiles;
    `pnpm --filter web-app lint`;
    `rg "onToggleMinimap" apps/web-app/src/components/chat/SessionStatusBar.tsx`
    shows the prop destructured and the handler wired in both layouts.
  - files: `apps/web-app/src/components/chat/SessionStatusBar.tsx`

- [ ] 5. **Update `SessionStatusBar.stories.tsx` to cover the new toggle.**
  - Add a story that renders the bar with `minimapOpen={false}` and another with
    `minimapOpen={true}` so the active state is reviewable in Storybook.
  - verify: `pnpm --filter web-app storybook` shows the new stories; visual review is
    sufficient for prop additions.
  - files: `apps/web-app/src/components/chat/SessionStatusBar.stories.tsx`

## Done when

- [ ] `pnpm --filter web-app check-types` and `pnpm --filter web-app lint` both pass.
- [ ] `pnpm --filter web-app exec vitest run` passes (no existing chat tests regress —
      note `ChatContainer.component.test.tsx` and `MessageList.stories.tsx` may need
      snapshot/prop updates if they assert on `SessionStatusBar` children or `MessageList`
      props).
- [ ] In a running dev session (`pnpm run dev`, open the web-app on 3001 and cloudy on
      4122), opening a chat tab with messages, clicking the new status-bar toggle,
      reveals an outline panel docked inside the chat on the right; clicking an item
      smooth-scrolls the matching message into the center of the viewport; the search
      box filters items by preview substring.
- [ ] The toggle's active state is visually distinct (icon color changes) when the panel
      is open.
- [ ] No `position: fixed`, no `scrollRef`, no `IntersectionObserver`, no manual
      `querySelector("[data-message-id=...]")` remain in `ChatMinimap.tsx`.

## Notes for implementer

- This plan touches 5 tightly-coupled files — over the `plan-generator` 1-2 file
  guideline, but the change is atomic (the feature doesn't work with any file missing).
  Treated as one unit deliberately.
- `apps/web-app/AGENTS.md` → "Never do" list: don't reintroduce `position: fixed` for
  panel overlays (it covers the tab bar / sidebar); don't hand-roll empty/error states
  (use `EmptyState size="inline"`); don't destructure Zustand stores wholesale (not
  relevant here unless you add a `minimapOpen` store — don't, ephemeral `useState` is
  fine).
- The primitive's `useMessageScrollerVisibility` only tracks `scrollAnchor`-flagged
  messages for `currentAnchorId`. `scrollAnchor` is set on user messages only
  (`MessageList.tsx:198-201`). So `currentAnchorId` is `null` whenever no user message is
  near the top — handle that gracefully (no item highlighted, not a crash).
- The old `ChatMinimap.tsx` had a `textContent` field used as a search index. That's
  overkill — preview substring search covers 95% of intents. Drop it.
- Don't add a Storybook story for `ChatMinimap` itself in this plan — it depends on the
  `MessageScrollerProvider` context, which makes a standalone story awkward. Cover it
  indirectly via `MessageList.stories.tsx` (already exists) by adding a `minimapOpen`
  variant there if the existing story breaks; otherwise skip.
- The `SessionStatusBar` is `memo`-ized (`SessionStatusBar.tsx:86`). Adding new optional
  props won't break memoization, but the inline `() => setMinimapOpen(...)` callback in
  `ChatContainer` changes identity every render. If you see unnecessary re-renders, wrap
  the callbacks in `useCallback` in `ChatContainer`. Probably fine to skip
  pre-optimization.
- If you bump into `apps/web-app/src/components/chat/ChatContainer.component.test.tsx`
  failures, update the test fixture rather than weakening assertions — it's there to lock
  the container's structure.
