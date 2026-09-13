---
title: Extract message components to @repo/ui
slug: extract-message-components-to-repo-ui
id: 20260913-extract-message-components-to-repo-ui
status: ready
created: 2026-09-13
source: planning session 2026-09-13
---

# Plan: Extract message components to @repo/ui

## Why

The browser extension (planned next) must render the same chat surface as the web-app.
After the decoupling plan
(`docs/plan/20260913-decouple-chat-message-components.md`) the presentational message
components are pure, so this plan moves them into the existing `@repo/ui` package.
Scope is **presentational only**: data hooks, stores, containers, and dialogs stay in
web-app; the extension will feed data via props.

Decisions already made: target is `@repo/ui` (not a new package);
`@opencode-ai/sdk` is allowed as a peer dependency of `@repo/ui`.

## Target file

| Path                                                                                     | Action                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/package.json`                                                               | edit — add `./components/message` export + `@opencode-ai/sdk` peer dep                                                                                                             |
| `packages/ui/src/components/message/**`                                                  | create — moved presentational tree (bubbles, parts, tool-components, `MessageListView`, `MessageError`, `RetryMessage`, `SessionErrorMessage`, `ThinkingAnimation`, context seams) |
| `packages/ui/src/components/markdown/**`                                                 | create — moved `MarkdownRenderer`, `CodeBlock`, `DiffViewer` (+ internal deps found in audit)                                                                                      |
| `packages/ui/src/lib/format.ts`, `packages/ui/src/lib/message-text.ts`                   | create — moved `formatTime`/`formatNumber`, `getTextFromParts`                                                                                                                     |
| `apps/web-app/src/components/chat/message/MessageList.tsx`, `StreamingMessageBubble.tsx` | edit — render moved components from `@repo/ui`                                                                                                                                     |
| `apps/web-app/src/components/chat/message/**` (moved files)                              | delete                                                                                                                                                                             |
| `apps/web-app/src/components/markdown/**` (moved files)                                  | delete or thin re-export                                                                                                                                                           |
| `apps/web-app/src/lib/format/`, `src/lib/message/text.ts`                                | delete or thin re-export                                                                                                                                                           |
| `apps/web-app/src/components/chat/message/MessageListView.stories.tsx`                   | create — pure-props reusability proof                                                                                                                                              |
| `apps/web-app/AGENTS.md`                                                                 | edit — directory map + chat section                                                                                                                                                |

## Context the new session needs

- **Prerequisite**: `docs/plan/20260913-decouple-chat-message-components.md` must be
  completed first — the import cycle, store leaks, and `MessageList` split are all
  resolved there. Do not attempt this plan without it.
- **Read `apps/web-app/AGENTS.md`** (component organization, Storybook conventions) and
  `docs/plan/20260913-extract-repo-ui-package.md` (the pattern used for the original
  shadcn → `@repo/ui` move — same playbook: move file, rewrite imports, keep web-app
  green).
- **`@repo/ui` package mechanics** (`packages/ui/package.json`):
  - Exports map: `"./components/*": "./src/components/*.tsx"` (flat files only). A
    directory needs an explicit entry pointing at an `index.ts` barrel — copy the
    `./components/empty-state` pattern at line 7. Add
    `"./components/message": "./src/components/message/index.ts"` and the same for
    `markdown`.
  - Internal import convention is self-reference: `import { cn } from "@repo/ui/lib/utils"`,
    `import { Button } from "@repo/ui/components/button"` (see
    `packages/ui/src/components/message-scroller.tsx:8-9`).
  - `lucide-react` and `next-themes` are already regular deps (lines 26-27).
    `@opencode-ai/sdk` is NOT — add it to `peerDependencies` AND `devDependencies`.
  - `@repo/ui` has **no test runner** — component tests stay in web-app (vitest only
    globs `apps/web-app/src/**`); rewrite their imports to `@repo/ui/...`.
- **What moves** (from `apps/web-app/src/components/chat/message/`):
  `MessageBubble`, `UserMessageBubble`, `AssistantMessageBubble`, `MessageParts`,
  `parts/**` (all 11 parts + `CollapsiblePart`, `ToolStateDisplay`, `ToolPreviewLabel`,
  barrel `parts/index.ts`), `parts/tool-components/**` (registry + 12 tools +
  `ExpandableToolCard` + `ToolValueRenderer` + `types.ts`), `MessageError`,
  `RetryMessage`, `SessionErrorMessage`, `ThinkingAnimation`, `MessageListView`, and the
  context seams from the decoupling plan (`context.ts`).
- **What stays in web-app**: `MessageList.tsx` (data orchestration), `useMessageListData.ts`,
  `StreamingMessageBubble.tsx` (per-token store subscription — deliberate perf design),
  `ChatContainer`, `ChatSurface`, `ChatEmptyState`, `ChatMinimap`, dialogs
  (`SessionViewDialog`), all stores and query hooks. The containers must mount the
  context providers (dialog seam + settings) around the moved tree.
- **Support files that must move first** (moved components import them):
  - `apps/web-app/src/types/message.ts` — thin SDK wrapper
    (`Message { info: OpencodeMessage; parts: Part[] }` over `@opencode-ai/sdk/v2`) →
    becomes `packages/ui/src/components/message/types.ts`; keep a re-export at the
    original path so app imports don't all change.
  - `apps/web-app/src/lib/format/` (`formatTime`, `formatNumber`) →
    `packages/ui/src/lib/format.ts`.
  - `apps/web-app/src/lib/message/text.ts` (`getTextFromParts`, 13 lines) →
    `packages/ui/src/lib/message-text.ts`.
  - `apps/web-app/src/hooks/useCopyMessage.ts` (16 lines, pure clipboard hook) →
    `packages/ui/src/hooks/use-copy-message.ts`.
  - `apps/web-app/src/components/markdown/`: `MarkdownRenderer.tsx`, `CodeBlock.tsx`,
    `DiffViewer.tsx` move; **audit first** — they may pull `CodeFrame.tsx`,
    `CodeView.tsx`, `@/lib/highlight`, `@/lib/refractor-custom`, `editor/`. Move what the
    three components need; the `editor/` folder and `code-editor` stay in web-app (they
    were deliberately left behind in the original extraction).
- **Storybook constraint**: web-app Storybook only globs `../src/**/*.stories.tsx`, so
  stories moved into `packages/ui/` stop rendering. Keep the `.stories.tsx` files in
  web-app and rewrite their imports to `@repo/ui/components/message` — full storybook
  migration for the package is the separate pending plan
  `docs/plan/20260913-repo-ui-storybook-and-docs.md`. Same for
  `DiffView.component.test.tsx` and `RetryMessage.component.test.tsx`: keep in web-app,
  rewrite imports.
- **`ThinkingAnimation` assets**: after the decoupling plan it takes `lightSrc`/`darkSrc`
  props with `/sprite/...` defaults. Ship the sprite PNGs by copying them into the
  extension/host app's public dir — do NOT make `@repo/ui` depend on web-app's
  `public/`.
- Conventions: no comments unless asked; `import type` for type-only imports; named
  exports; match `@repo/ui` file naming (kebab-case there: `message-scroller.tsx`,
  `CopyButton.tsx` is inconsistent — prefer kebab-case for new dirs but keep moved
  filenames as-is to minimize diff noise).

## Tasks

- [x] 1. Add `@opencode-ai/sdk` to `packages/ui/package.json` (peer + dev deps) and run
     `pnpm install`
  - verify: `grep -c "@opencode-ai/sdk" packages/ui/package.json` ≥ 2 &&
    `pnpm install` succeeds
  - files: `packages/ui/package.json`
- [x] 2. Move support utilities: `types/message.ts` content → `packages/ui/src/components/message/types.ts`,
     `lib/format/` → `packages/ui/src/lib/format.ts`, `lib/message/text.ts` →
     `packages/ui/src/lib/message-text.ts`, `hooks/useCopyMessage.ts` →
     `packages/ui/src/hooks/use-copy-message.ts`; leave thin re-export shims at the
     original web-app paths
  - verify: `pnpm --filter web-app check-types && pnpm --filter @repo/ui check-types`
    pass
  - files: both sides of each move
- [x] 3. Audit + move the markdown trio (`MarkdownRenderer`, `CodeBlock`, `DiffViewer`
     - whatever internal deps the audit reveals: `CodeFrame`, `CodeView`,
       `lib/highlight`, `lib/refractor-custom`) into `packages/ui/src/components/markdown/`
       with an `index.ts` barrel + export entry; web-app keeps shims or rewrites
       importers; keep `DiffView.component.test.tsx` in web-app with rewritten imports
  - verify: `pnpm --filter web-app check-types` passes &&
    `pnpm --filter web-app exec vitest run src/components/markdown` green
  - files: `packages/ui/src/components/markdown/**`, `apps/web-app/src/components/markdown/**`
- [x] 4. Move the presentational message tree into
     `packages/ui/src/components/message/` (list under "What moves" above) with an
     `index.ts` barrel + `"./components/message": "./src/components/message/index.ts"`
     export; rewrite intra-package imports to the `@repo/ui/...` self-reference
     convention
  - verify: `pnpm --filter @repo/ui check-types` passes &&
    `grep -rn "@/stores/\|@/hooks/queries/" packages/ui/src/` returns nothing
  - files: `packages/ui/src/components/message/**`
- [x] 5. Rewire web-app: `MessageList.tsx`, `StreamingMessageBubble.tsx`, containers,
     and remaining stories import from `@repo/ui/components/message`; delete the moved
     files from `apps/web-app/src/components/chat/message/`; containers mount the
     dialog + settings context providers around the moved tree
  - verify: `ls apps/web-app/src/components/chat/message/` shows only `MessageList.tsx`,
    `useMessageListData.ts`, `StreamingMessageBubble.tsx` (+ their stories/tests) &&
    `pnpm --filter web-app lint && pnpm --filter web-app check-types` pass
  - files: `apps/web-app/src/components/chat/**`
- [x] 6. Add `MessageListView.stories.tsx` in web-app rendering the full message list
     purely from mock props (varied parts: text, reasoning, tool calls, error, retry)
     with zero store/query imports — this is the extension-usage proof
  - verify: story renders in `pnpm --filter web-app storybook` &&
    `grep -c "@/stores/\|@/hooks/" apps/web-app/src/components/chat/message/MessageListView.stories.tsx`
    returns 0
  - files: `apps/web-app/src/components/chat/message/MessageListView.stories.tsx`
- [x] 7. Update `apps/web-app/AGENTS.md` — directory map (`chat/` now hosts only
     orchestration; presentational tree lives in `@repo/ui/components/message`) and
     the component-organization section
  - verify: `grep -n "@repo/ui/components/message" apps/web-app/AGENTS.md` matches
  - files: `apps/web-app/AGENTS.md`

## Done when

- [ ] `grep -rn "@/stores/\|@/hooks/queries/\|SessionViewDialog" packages/ui/src/components/message/`
      returns nothing — the moved tree is app-coupling-free
- [x] `pnpm --filter web-app lint && pnpm --filter web-app check-types &&
  pnpm --filter @repo/ui check-types && pnpm --filter web-app exec vitest run`
      all green
- [x] The pure-props `MessageListView` story renders the full chat surface in Storybook
      without any web-app data layer
- [x] `packages/ui/package.json` lists `@opencode-ai/sdk` in `peerDependencies`

## Notes for implementer

- Do the tasks in order; tasks 2–3 are prerequisites for 4 (moved components import the
  utilities and markdown trio).
- If the markdown audit (task 3) finds `editor/`-coupled code that can't move cleanly,
  stop and inject it as a prop/render callback instead of dragging `editor/` into
  `@repo/ui` — `code-editor` was deliberately kept app-side in the original extraction.
- Do NOT move `StreamingMessageBubble`, `MessageList`, `useMessageListData`, stores, or
  query hooks — data layer is app-side by design (the extension provides its own).
- Storybook stories and component tests stay in web-app (globs only cover
  `apps/web-app/src/**`); package-level storybook is the pending
  `20260913-repo-ui-storybook-and-docs.md` plan — don't expand scope here.
- After task 5, eyeball the chat tab, bot chat, desk chat-node, and subtask dialog in
  Storybook — the dialog seam (context provider mounting) is the easiest thing to get
  wrong.
