---
title: Remove dead Header/ChatPage/SidebarToggle chain
slug: remove-dead-header-chatpage-chain
id: 20260813-remove-dead-header-chatpage-chain
status: ready
created: 2026-08-13
source: planning session 2026-08-13
---

# Plan: Remove dead Header/ChatPage/SidebarToggle chain

## Why

The legacy `Header` component (the predecessor of the new `AppBar` at
`src/components/layout/app-bar/`) has exactly one consumer, `ChatPage`, which is itself a
default export with zero importers anywhere in the repo — no route mounts it, no lazy/dynamic
import references it. Following the import chain, `SidebarToggle` and
`TokenUsageIndicator` also have `ChatPage` as their only consumer, making the whole chain
dead code that should be removed.

## Target file

| Path                                                       | Action                               |
| ---------------------------------------------------------- | ------------------------------------ |
| `apps/web-app/src/features/chat/ChatPage.tsx`              | delete                               |
| `apps/web-app/src/components/layout/Header.tsx`            | delete                               |
| `apps/web-app/src/components/layout/SidebarToggle.tsx`     | delete                               |
| `apps/web-app/src/components/chat/TokenUsageIndicator.tsx` | delete                               |
| `apps/web-app/src/components/layout/index.ts`              | edit (remove the `Header` re-export) |

## Context the new session needs

- **Why these are dead:** `Header` is imported only by `ChatPage.tsx:4`. `ChatPage` is a
  `export default function ChatPage` (line 20) but `rg "ChatPage"` across the repo finds
  zero importers — no route, no lazy/dynamic import. `SidebarToggle` is imported only by
  `ChatPage.tsx:15`. `TokenUsageIndicator` is imported only by `ChatPage.tsx:3`.
  Verification commands that confirm this (re-run before deleting):
  - `rg "from ['\"]@/components/layout['\"]" apps/web-app/src | rg Header` → only ChatPage
  - `rg "ChatPage" apps/web-app/src` → only the definition file itself
  - `rg "SidebarToggle|TokenUsageIndicator" apps/web-app/src` → only ChatPage + the defs

- **Do NOT delete `ChatContainer` or `CreateChatDialog`.** They are also imported by
  `ChatPage`, but they have other live consumers:
  - `ChatContainer` is used by `features/desk/nodes/implementations/chat-node/ChatNode.tsx:1`
    and `features/home/tabs/implementations/chat/ChatContent.tsx:14`.
  - `CreateChatDialog` is used by `features/home/tabs/implementations/chat/ChatCreateDialog.tsx:3`
    and `features/desk/nodes/implementations/chat-node/meta.ts:3`.

- **The `features/chat/` folder survives** — it still holds `components/CreateChatDialog/`
  which has live consumers listed above. Only `ChatPage.tsx` is removed from that folder.

- **The new replacement primitive is `AppBar`** at
  `apps/web-app/src/components/layout/app-bar/AppBar.tsx` (root + `.Leading` / `.Title` /
  `.Actions` / `.ActionIcon` sub-components). It already has the two former `Header` use
  sites migrated: `SettingsDetailHeader.tsx` and `MobileTabBar.tsx`. Nothing else needs to
  migrate — `ChatPage` was the only remaining `Header` consumer and it's dead.

- **`components/layout/index.ts` currently re-exports `Header`** on line 2:
  `export { Header } from "./Header";`. Remove that line. Leave the other exports
  (`Center`, `AppBar`, `WelcomeScreen`) alone.

- **Conventions (from `apps/web-app/AGENTS.md`):** ESM only, no `require`. No comments
  unless explicitly asked. `verbatimModuleSyntax` is on — use `import type` for type-only
  imports (not relevant for deletes, but matters if anything gets re-added).

## Tasks

Order matters: delete from the leaves of the import graph inward, ending with the barrel
edit, so the repo compiles after each step.

- [ ] 1. **Re-confirm the dead chain hasn't grown new consumers since the plan was written.**
  - verify: `rg "ChatPage|SidebarToggle|TokenUsageIndicator" apps/web-app/src` returns only
    the four target files (and no new importers). If anything else shows up, STOP and
    re-scope before deleting.
  - files: (read-only verification, no edits)

- [ ] 2. **Delete `apps/web-app/src/features/chat/ChatPage.tsx`.**
  - verify: `pnpm --filter web-app run check-types` passes. This is the load-bearing delete
    — once it's gone, `Header`, `SidebarToggle`, and `TokenUsageIndicator` lose their only
    consumer and become orphans (but typecheck still passes because nothing imports them
    either).
  - files: `apps/web-app/src/features/chat/ChatPage.tsx`

- [ ] 3. **Delete `apps/web-app/src/components/layout/Header.tsx` and remove its re-export.**
  - verify: `pnpm --filter web-app run check-types` passes; `rg "Header" apps/web-app/src/components/layout/index.ts`
    returns nothing.
  - files: `apps/web-app/src/components/layout/Header.tsx` (delete),
    `apps/web-app/src/components/layout/index.ts` (edit — remove line 2)

- [ ] 4. **Delete `apps/web-app/src/components/layout/SidebarToggle.tsx`.**
  - verify: `pnpm --filter web-app run check-types` passes;
    `rg "SidebarToggle" apps/web-app/src` returns nothing.
  - files: `apps/web-app/src/components/layout/SidebarToggle.tsx`

- [ ] 5. **Delete `apps/web-app/src/components/chat/TokenUsageIndicator.tsx`.**
  - verify: `pnpm --filter web-app run check-types` passes;
    `rg "TokenUsageIndicator" apps/web-app/src` returns nothing.
  - files: `apps/web-app/src/components/chat/TokenUsageIndicator.tsx`

- [ ] 6. **Run full lint + typecheck + test suite to confirm nothing regressed.**
  - verify: `pnpm --filter web-app run lint && pnpm --filter web-app run check-types`
    both pass; `pnpm --filter web-app exec vitest run` passes.
  - files: (verification only)

## Done when

- [ ] `pnpm --filter web-app run check-types` exits 0
- [ ] `pnpm --filter web-app run lint` exits 0
- [ ] `pnpm --filter web-app exec vitest run` passes (no new failures vs. baseline)
- [ ] `rg "from ['\"]@/components/layout/Header['\"]|features/chat/ChatPage|SidebarToggle|TokenUsageIndicator" apps/web-app/src`
      returns zero matches
- [ ] The four deleted files no longer appear in `apps/web-app/src/`
- [ ] `features/chat/` folder still exists and still contains `components/CreateChatDialog/`
      (do NOT delete that — it has live consumers)

## Notes for implementer

- The repo is git-tracked — no `.bak` files; rollback via `git checkout` if needed.
- Do not commit unless explicitly asked (per root `AGENTS.md`).
- Match the existing `index.ts` export style (one named export per line, no grouping).
- If task 1 reveals a new consumer of `ChatPage`/`SidebarToggle`/`TokenUsageIndicator`
  appeared between plan-writing and execution, STOP and re-scope — do not blindly delete.
