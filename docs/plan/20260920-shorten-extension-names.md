---
title: Shorten extension names
slug: shorten-extension-names
id: 20260920-shorten-extension-names
status: ready
created: 2026-09-20
source: planning session 2026-09-20
---

# Plan: Shorten extension store and component names

## Why

The browser extension currently prefixes local Zustand stores and side-panel components with `Extension`, even though their directory and package already define the extension scope. The repeated prefix makes imports and component usage unnecessarily verbose without preventing meaningful collisions. Rename the local symbols and files to concise domain names while preserving behavior and public shared UI component names.

## Target file

| Path                                                                                    | Action                           |
| --------------------------------------------------------------------------------------- | -------------------------------- |
| `apps/browser-extension/entrypoints/sidepanel/stores/chatStore.ts`                      | edit                             |
| `apps/browser-extension/entrypoints/sidepanel/stores/sessionStore.ts`                   | edit                             |
| `apps/browser-extension/entrypoints/sidepanel/stores/favoriteModelsStore.ts`            | edit                             |
| `apps/browser-extension/entrypoints/sidepanel/App.tsx`                                  | edit                             |
| `apps/browser-extension/entrypoints/sidepanel/components/ExtensionChatInput.tsx`        | rename to `ChatInput.tsx`        |
| `apps/browser-extension/entrypoints/sidepanel/components/ExtensionMessageList.tsx`      | rename to `MessageList.tsx`      |
| `apps/browser-extension/entrypoints/sidepanel/components/ExtensionModelSelector.tsx`    | rename to `ModelSelector.tsx`    |
| `apps/browser-extension/entrypoints/sidepanel/components/ExtensionSessionAppBar.tsx`    | rename to `SessionAppBar.tsx`    |
| `apps/browser-extension/entrypoints/sidepanel/components/ExtensionSessionPicker.tsx`    | rename to `SessionPicker.tsx`    |
| `apps/browser-extension/entrypoints/sidepanel/components/ExtensionSessionStatusBar.tsx` | rename to `SessionStatusBar.tsx` |

## Context the new session needs

- The extension side-panel components are local to `apps/browser-extension/entrypoints/sidepanel/components/`; the `Extension` prefix is redundant at this scope. `BrowserWorkspaceLanding` already demonstrates the preferred naming style by omitting it.
- Current store exports are `useExtensionChatStore`, `useExtensionSessionStore`, and `useExtensionFavoriteModelsStore` in the three files under `entrypoints/sidepanel/stores/`. Rename them to `useChatStore`, `useSessionStore`, and `useFavoriteModelsStore`; do not move them into `apps/web-app` or `packages/opencode`.
- Current component symbols and files are `ExtensionChatInput`, `ExtensionMessageList`, `ExtensionModelSelector`, `ExtensionSessionAppBar`, `ExtensionSessionPicker`, and `ExtensionSessionStatusBar`. Rename both filenames and exported symbols to `ChatInput`, `MessageList`, `ModelSelector`, `SessionAppBar`, `SessionPicker`, and `SessionStatusBar`.
- `ModelSelector.tsx` will have a local name collision with `ModelSelector` imported from `@repo/ui/components/model-selector`. Alias the shared primitive (for example `PureModelSelector`) or otherwise keep the two references unambiguous.
- Rename the local `ExtensionModel` type to `Model` or remove the alias where the shared `ModelSelectorModel` type can be imported directly. Do not rename the shared `@repo/ui` type or component.
- Update all imports and JSX references, especially `App.tsx` and `ChatInput.tsx`; search the entire extension package for the old names after the rename.
- Follow the repository frontend convention: use individual Zustand selectors and keep server state in TanStack Query. This change is naming-only and must not alter persistence keys, browser storage behavior, query keys, event handling, or rendered behavior.

## Tasks

- [x] 1. Rename the three extension store exports to concise names and update all store consumers.
  - verify: `pnpm --dir apps/browser-extension compile`
  - files: `entrypoints/sidepanel/stores/chatStore.ts`, `entrypoints/sidepanel/stores/sessionStore.ts`, `entrypoints/sidepanel/stores/favoriteModelsStore.ts`, `entrypoints/sidepanel/App.tsx`
- [x] 2. Rename the six side-panel component files and exported component symbols, resolving the local/shared `ModelSelector` name collision with an import alias.
  - verify: `rg "Extension(ChatInput|MessageList|ModelSelector|SessionAppBar|SessionPicker|SessionStatusBar)" apps/browser-extension` returns no matches
  - files: `entrypoints/sidepanel/components/ExtensionChatInput.tsx`, `entrypoints/sidepanel/components/ExtensionMessageList.tsx`, `entrypoints/sidepanel/components/ExtensionModelSelector.tsx`, `entrypoints/sidepanel/components/ExtensionSessionAppBar.tsx`, `entrypoints/sidepanel/components/ExtensionSessionPicker.tsx`, `entrypoints/sidepanel/components/ExtensionSessionStatusBar.tsx`, and their renamed counterparts
- [x] 3. Update every side-panel import and prop/type reference to the renamed components without changing component behavior.
  - verify: `pnpm --dir apps/browser-extension compile`
  - files: `entrypoints/sidepanel/App.tsx`, `entrypoints/sidepanel/components/ChatInput.tsx`, `entrypoints/sidepanel/components/SessionAppBar.tsx`, `entrypoints/sidepanel/components/ModelSelector.tsx`
- [x] 4. Run extension tests and production build after the complete rename.
  - verify: `pnpm --dir apps/browser-extension exec vitest run && pnpm --dir apps/browser-extension build`
  - files: all renamed side-panel components and stores

## Done when

- [x] No local side-panel store or component symbol/file retains the redundant `Extension` prefix, except names that intentionally describe a shared external API or unrelated extension concept.
- [x] `pnpm --dir apps/browser-extension compile` passes with all renamed imports resolved.
- [x] Existing extension tests pass and `pnpm --dir apps/browser-extension build` produces the extension successfully.
- [x] Browser storage keys, React Query keys, component props, UI behavior, and persistence behavior remain unchanged.

## Notes for implementer

- This is a cross-file rename; use filesystem-aware moves and inspect `git diff` to ensure the old files are represented as renames rather than duplicate copies.
- Do not rename `@repo/ui`'s shared `ModelSelector`, `ModelSelectorModel`, or any `Extension` terminology outside the extension side-panel scope.
- Do not modify unrelated existing worktree changes in `apps/browser-extension/package.json`, `pnpm-lock.yaml`, or `entrypoints/sidepanel/styles/style.css`.
- Do not commit unless explicitly requested.
