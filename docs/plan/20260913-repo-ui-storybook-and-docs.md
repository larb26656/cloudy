---
title: "Storybook and docs for @repo/ui"
slug: repo-ui-storybook-and-docs
id: 20260913-repo-ui-storybook-and-docs
status: ready
created: 2026-09-13
source: planning session 2026-09-13
---

# Plan: Storybook and docs for @repo/ui

## Why

`@repo/ui` (created by plan `20260913-extract-repo-ui-package.md`) owns the shared
components, but its five Storybook stories still live in `apps/web-app` and the repo docs
(root `AGENTS.md`, `apps/web-app/AGENTS.md`) still describe the pre-extraction layout. This
plan gives the package its own Storybook 10 setup, relocates the stories next to their
components, audits local drift vs the shadcn registry, and updates all documentation so a
fresh session sees the real structure.

## Target file

| Path                                          | Action                                           |
| --------------------------------------------- | ------------------------------------------------ |
| `packages/ui/.storybook/main.ts`              | create                                           |
| `packages/ui/.storybook/preview.tsx`          | create                                           |
| `packages/ui/src/storybook/preview.ts`        | create (alias shim)                              |
| `packages/ui/vitest.config.ts`                | create                                           |
| `packages/ui/package.json`                    | edit (storybook/vitest scripts + devDeps)        |
| `packages/ui/src/components/**/*.stories.tsx` | create (moved from web-app)                      |
| `apps/web-app/src/components/**`              | edit/delete (story files removed)                |
| `packages/ui/AGENTS.md`                       | create                                           |
| `AGENTS.md`                                   | edit (repo tree + package list)                  |
| `apps/web-app/AGENTS.md`                      | edit (ui imports, Storybook, DESIGN.md pointers) |

## Context the new session needs

### Prerequisite

Plan `20260913-extract-repo-ui-package.md` must be completed: `packages/ui` exists with
`components.json`, theme CSS, and the shared components (`empty-state/`, `error-state`,
`loading-state`, `color-picker/`, `center.tsx`).

### Reference configs to mirror (read these first)

- `apps/web-app/.storybook/main.ts` — Storybook 10, addons (chromatic, vitest, a11y,
  docs), story globs `../src/**/*.stories.@(js|jsx|mjs|ts|tsx)`.
- `apps/web-app/.storybook/preview.tsx` — `definePreview(...)` wiring `addonDocs()`,
  MSW loader, a11y config (`test: "todo"`).
- `apps/web-app/src/storybook/preview.ts` — one-line shim re-exporting the preview for
  the `@/` alias.
- `apps/web-app/vitest.config.ts` — the `storybook` vitest project using
  `@storybook/addon-vitest`'s `storybookTest` plugin with headless chromium.
- `apps/web-app/package.json` — scripts `storybook`, `build-storybook`, `test`.

### Package-specific decisions (already made)

- Framework: `@storybook/react-vite` (NOT `@storybook/tanstack-react` — the package has no
  router; web-app uses tanstack-react only because it hosts routed pages).
- Preview: `definePreview` with `addonDocs()` + a11y (`test: "todo"`). **No MSW** — the
  package has no API-touching components.
- Skip `@chromatic-com/storybook` in the package (web-app keeps Chromatic).
- Story authoring stays the type-safe API: `preview.meta({...})` / `meta.story({...})`
  per `apps/web-app/AGENTS.md` — stories import the preview via the
  `@repo/ui/src/storybook/preview` shim or a relative path (there is no `@/` alias inside
  the package).
- Vitest `storybook` project needs headless chromium: add `playwright` devDep; run
  `pnpm exec playwright install chromium` once if missing.

### The five stories to move (and their fixes)

| Story (current location in web-app)                      | Fix while moving                                                                                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/empty-state/base.stories.tsx`         | import preview from package shim                                                                                                                          |
| `src/components/ui/error-state.stories.tsx`              | same                                                                                                                                                      |
| `src/components/ui/loading-state.stories.tsx`            | same                                                                                                                                                      |
| `src/components/ui/color-picker/ColorPicker.stories.tsx` | same + **replace `WORKSPACE_COLORS` (imported from `@/lib/cloudy/workspaces`) with an inline color palette array** — the package must not import app code |
| `src/components/layout/Center.stories.tsx`               | move next to `center.tsx` in the package                                                                                                                  |

Keep story `title` hierarchies unchanged. The `code-editor` and `route-state` stories stay
in web-app (those components are app-coupled).

### shadcn drift audit

Moved components may carry local edits made before the extraction. From `apps/web-app`
(target of both `components.json` files):

```sh
pnpm dlx shadcn@latest add <name> --dry-run      # lists affected files
pnpm dlx shadcn@latest add <name> --diff <file>  # upstream vs local diff
```

Run for a representative set (button, dialog, select, sidebar, sonner, empty-state is not
in registry — skip customs). **Informational only — never `--overwrite`.** Record which
components are locally modified (commit message or PR description).

### Docs updates

- `packages/ui/AGENTS.md` (new): purpose, directory map, self-alias imports, how
  `@source "../"` in `src/styles/globals.css` makes Tailwind scan the package, how to add
  components (`pnpm dlx shadcn@latest add <x>` from an app), Storybook commands, the
  rule that package code never imports app code (`@/...`).
- Root `AGENTS.md`: add `ui/` to the `packages/` tree blurb.
- `apps/web-app/AGENTS.md`: ui primitives now come from `@repo/ui/components/*`; `cn()`
  from `@repo/ui/lib/utils`; `src/components/ui/` holds only app-coupled components;
  Storybook section notes the five moved stories now live in the package; DESIGN.md's
  token source is `packages/ui/src/styles/globals.css`.

## Tasks

- [ ] 1. **Add Storybook + vitest infra to `@repo/ui`**
  - devDeps: `storybook@^10`, `@storybook/react-vite`, `@storybook/addon-docs`,
    `@storybook/addon-a11y`, `@storybook/addon-vitest`, `playwright`, plus
    `vitest`/`jsdom` per web-app's versions. Scripts: `storybook`, `build-storybook`,
    `test` (vitest run). Create `.storybook/main.ts` (framework react-vite, story globs,
    a11y+docs+vitest addons), `.storybook/preview.tsx` (docs + a11y, no MSW),
    `src/storybook/preview.ts` shim, `vitest.config.ts` with the `storybookTest` project.
  - verify: `pnpm install && pnpm --filter @repo/ui build-storybook` exits 0
  - files: `packages/ui/.storybook/**`, `packages/ui/vitest.config.ts`,
    `packages/ui/src/storybook/preview.ts`, `packages/ui/package.json`
- [ ] 2. **Move the five stories into the package (with fixes per Context)**
  - `git mv` each story next to its component, rewrite preview imports, replace
    `WORKSPACE_COLORS` with an inline palette. Delete them from web-app.
  - verify: `pnpm --filter @repo/ui exec vitest run` (storybook project finds and passes
    the stories) and `pnpm --filter web-app exec vitest run` (still green with fewer
    stories)
  - files: `packages/ui/src/components/**`, `apps/web-app/src/components/**`
- [ ] 3. **Run the shadcn drift audit** (per Context commands; informational only)
  - verify: command pair runs for button/dialog/select/sidebar/sonner and the set of
    locally-modified components is recorded in the commit message or PR description
  - files: —
- [ ] 4. **Update docs** (`packages/ui/AGENTS.md`, root `AGENTS.md`,
     `apps/web-app/AGENTS.md` per Context)
  - verify: `grep -q "packages/ui" AGENTS.md && grep -q "@repo/ui" apps/web-app/AGENTS.md`
    and `pnpm --filter web-app design:lint` passes
  - files: `AGENTS.md`, `apps/web-app/AGENTS.md`, `packages/ui/AGENTS.md`
- [ ] 5. **Final gate**
  - verify: `pnpm run lint && pnpm run check-types && pnpm --filter web-app test && pnpm --filter @repo/ui test && pnpm build:full`
  - files: —

## Done when

- [ ] `pnpm --filter @repo/ui storybook` serves the package's stories (empty/error/
      loading states, ColorPicker, Center) on port 6006
- [ ] `pnpm --filter @repo/ui exec vitest run` passes (storybook interaction tests via
      headless chromium)
- [ ] No `.stories.tsx` for moved components remains under `apps/web-app/src` (verify:
      `ls apps/web-app/src/components/ui/color-picker/` shows only the component)
- [ ] Root and web-app `AGENTS.md` mention `@repo/ui` and `design:lint` still passes

## Notes for implementer

- ESM only; `import type`; no comments unless asked; Prettier defaults.
- Inside `@repo/ui` there is no `@/` alias — use relative imports or the
  `src/storybook/preview` shim.
- Never `--overwrite` in task 3; local component edits are intentional.
- Controlled components in stories follow the `XxxDemo` wrapper pattern (see
  `ColorPicker` story's `WithReactHookForm` for the existing precedent).
- Do not commit unless explicitly asked.
