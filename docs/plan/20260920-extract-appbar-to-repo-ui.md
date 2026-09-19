---
title: Extract AppBar to @repo/ui
slug: extract-appbar-to-repo-ui
id: 20260920-extract-appbar-to-repo-ui
status: ready
created: 2026-09-20
source: planning session 2026-09-20
---

# Plan: Extract AppBar to @repo/ui

## Why

`AppBar` is a generic layout primitive, but it currently lives under the web-app and is
already reused by multiple web-app surfaces. Move the primitive into `@repo/ui` so chat
header/sidebar work and future consumers use the same package-owned component instead of
creating another app-local copy.

## Target file

| Path                                                            | Action                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `packages/ui/src/components/app-bar.tsx`                        | create — package-owned AppBar compound component                          |
| `apps/web-app/src/components/layout/app-bar/AppBar.tsx`         | delete — old app-local implementation                                     |
| `apps/web-app/src/components/layout/index.ts`                   | edit — remove the local AppBar export and re-export the package component |
| `apps/web-app/src/components/layout/app-bar/AppBar.stories.tsx` | edit — import AppBar from `@repo/ui/components/app-bar`                   |

## Context the new session needs

- The source implementation is `apps/web-app/src/components/layout/app-bar/AppBar.tsx:1-100`.
  Preserve its compound API: `AppBar`, `AppBar.Leading`, `AppBar.Title`, `AppBar.Actions`,
  and `AppBar.ActionIcon`, including the `sticky` prop and the `ActionIcon` size mapping.
- `@repo/ui/package.json:7-14` already exposes `./components/*` to `./src/components/*.tsx`,
  so creating `packages/ui/src/components/app-bar.tsx` is sufficient; do not add a second
  bespoke export pattern unless TypeScript proves it necessary.
- Package components may import `@repo/ui/components/button` and `@repo/ui/lib/utils`, but
  must not import web-app aliases or app code. `lucide-react` is already a package dependency.
- Existing consumers include `apps/web-app/src/features/home/components/MobileTabBar.tsx`
  and `apps/web-app/src/features/home/tabs/implementations/chat/ChatHeaderActions.tsx`.
  Keep their imports working through `apps/web-app/src/components/layout/index.ts` so this
  extraction does not mix the package migration with chat behavior changes.
- Follow the repository conventions: ESM, `import type` for type-only imports, no comments
  unless needed, and default Prettier formatting. Do not move the Storybook setup in this plan.

## Tasks

- [x] 1. Copy the existing AppBar implementation into `packages/ui/src/components/app-bar.tsx` and keep the public compound-component contract unchanged
  - verify: `pnpm --filter @repo/ui check-types` passes
  - files: `packages/ui/src/components/app-bar.tsx`
- [x] 2. Replace the app-local implementation with a package re-export and update the AppBar story import
  - verify: `pnpm --filter web-app check-types` passes and `rg 'from "./AppBar"' apps/web-app/src/components/layout/app-bar` returns no matches
  - files: `apps/web-app/src/components/layout/app-bar/AppBar.tsx`, `apps/web-app/src/components/layout/index.ts`, `apps/web-app/src/components/layout/app-bar/AppBar.stories.tsx`
- [x] 3. Run package and app quality checks
  - verify: `pnpm --filter @repo/ui lint && pnpm --filter @repo/ui check-types && pnpm --filter web-app lint && pnpm --filter web-app check-types`
  - files: —

## Done when

- [x] `@repo/ui` owns the only AppBar implementation.
- [x] Existing mobile tab bar and chat header action consumers compile without local AppBar imports.
- [x] The AppBar Storybook stories still render from the web-app Storybook setup.
- [x] Package and web-app lint/typecheck pass.

## Notes for implementer

- Do not change AppBar styling or API during extraction; visual changes belong in the chat shell plan.
- Do not commit unless explicitly asked.
