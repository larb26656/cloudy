---
title: Remove bot-chat UI
slug: remove-bot-chat-ui
id: 20261018-remove-bot-chat-ui
status: ready
created: 2026-10-18
source: planning session 2026-10-18
---

# Plan: Remove bot-chat UI

## Why

The web-app's dedicated `bot-chat` experience is no longer needed. Remove its tab, Desk node, and bot-chat-specific UI while keeping the regular chat experience and Cloudy AI backend/runtime available. Existing bot workspaces and saved client state must not leave the app with broken navigation or an unusable Desk canvas.

## Target file

This change spans multiple connected frontend features and should be implemented in the ordered phases below. Discover and update all directly affected source and test files as part of each phase.

| Path                                                                  | Action         |
| --------------------------------------------------------------------- | -------------- |
| `apps/web-app/src/features/home/tabs/implementations/bot-chat/`       | delete         |
| `apps/web-app/src/features/home/tabs/template/registry.ts`            | edit           |
| `apps/web-app/src/stores/tabStore.ts` and related tests               | edit           |
| `apps/web-app/src/features/desk/nodes/implementations/bot-chat-node/` | delete         |
| `apps/web-app/src/features/desk/nodes/template/index.ts`              | edit           |
| `apps/web-app/src/stores/flowStore.ts` and related tests              | edit           |
| Bot-chat-specific UI and consumers under `apps/web-app/src/`          | edit or delete |

## Context the new session needs

- Read the root `AGENTS.md` and `apps/web-app/AGENTS.md` before implementing. The frontend guide documents the tab registry, persisted tab migrations, Desk node registry, and web-app validation commands.
- Tab definitions are registered in `apps/web-app/src/features/home/tabs/template/registry.ts:8-15`; the `Tab` and `TabDataMap` types derive from this registry. Removing the template changes the type union throughout the frontend.
- The `bot-chat` tab implementation is in `apps/web-app/src/features/home/tabs/implementations/bot-chat/`. Other known entry points include `apps/web-app/src/routes/__root.tsx`, `features/home/components/RecentSessionsSection.tsx`, `SessionList.tsx`, `WorkspaceDetail.tsx`, and `components/pet/openSessionTab.ts`.
- Persisted tabs are migrated in `apps/web-app/src/stores/tabStore.ts`. Preserve valid existing session information by routing old bot-chat tabs to the regular `chat` tab where compatible; do not leave persisted tabs with an unregistered type. Review `tabStore.test.ts` and update migration coverage.
- The Desk node is registered in `apps/web-app/src/features/desk/nodes/template/index.ts:17-30` and implemented in `apps/web-app/src/features/desk/nodes/implementations/bot-chat-node/`. Desk flows persist locally through `apps/web-app/src/stores/flowStore.ts`; inspect its migrations and tests before deciding how to handle saved `bot-chat` nodes. Preserve the rest of each flow and avoid silently dropping user content.
- Bot-specific workspace behavior is also used in home and pet flows. This plan keeps bot workspaces and the backend; map their chat entry points to the ordinary chat tab and retain necessary session/workspace metadata. Do not remove Cloudy providers, APIs, LLM runtime, or persistence.
- `BotChatContainer`, `BotChatInput`, and `CreateBotChatDialog` may have additional imports or stories/tests. Search the full `apps/web-app/src` tree for `bot-chat`, `BotChat`, `botChat`, and `CreateBotChatDialog` before deleting shared components.

## Tasks

- [ ] 1. Remove the bot-chat tab template and redirect all entry points to the regular chat tab while preserving session/workspace data.
  - verify: `pnpm --filter web-app check-types` passes; tab/home/pet tests for touched paths pass.
  - files: `apps/web-app/src/features/home/tabs/implementations/bot-chat/`, `apps/web-app/src/features/home/tabs/template/registry.ts`, `apps/web-app/src/stores/tabStore.ts`, and discovered tab entry points/tests
- [ ] 2. Migrate persisted bot-chat tabs and update compatibility tests so old local storage cannot restore an unregistered tab type.
  - verify: `pnpm --filter web-app exec vitest run src/stores/tabStore.test.ts` passes and covers migration of persisted bot-chat/bot tabs.
  - files: `apps/web-app/src/stores/tabStore.ts`, `apps/web-app/src/stores/tabStore.test.ts`
- [ ] 3. Remove the bot-chat Desk node and safely handle persisted bot-chat nodes without corrupting other saved flow content.
  - verify: `pnpm --filter web-app exec vitest run src/stores/flowStore.test.ts` passes with migration coverage for saved bot-chat nodes; `pnpm --filter web-app check-types` passes.
  - files: `apps/web-app/src/features/desk/nodes/implementations/bot-chat-node/`, `apps/web-app/src/features/desk/nodes/template/index.ts`, `apps/web-app/src/stores/flowStore.ts`, `apps/web-app/src/stores/flowStore.test.ts`
- [ ] 4. Delete bot-chat-only components and tests/stories only after confirming no regular-chat or other feature consumers remain.
  - verify: repository search finds no active imports/references to `BotChatContainer`, `BotChatInput`, or `CreateBotChatDialog`; `pnpm --filter web-app check-types` passes.
  - files: discovered bot-chat-only components, stories, tests, and barrels under `apps/web-app/src/`
- [ ] 5. Run full web-app validation and inspect the final reference search.
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run && pnpm --filter web-app build` passes; remaining `bot-chat` references are limited to intentional historical storage migrations/tests or removed-feature compatibility handling.
  - files: all changed web-app files

## Done when

- [ ] No dedicated `bot-chat` tab or Desk node is registered or available through the UI.
- [ ] Existing bot-chat tab and Desk persistence does not break app startup, navigation, or unrelated saved Desk content.
- [ ] Bot workspace chat entry points use the regular chat tab; Cloudy backend/provider/runtime and workspace data remain intact.
- [ ] Web-app lint, typecheck, tests, and production build pass.

## Notes for implementer

- Do not edit generated `apps/web-app/src/routeTree.gen.ts` by hand.
- Use ESM and type-only imports where appropriate; follow the no-comments-unless-asked convention.
- Follow `apps/web-app/AGENTS.md` checklist: run `pnpm --filter web-app lint`, `pnpm --filter web-app check-types`, and `pnpm --filter web-app exec vitest run`.
