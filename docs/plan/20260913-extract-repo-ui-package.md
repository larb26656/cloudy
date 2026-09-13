---
title: "Extract @repo/ui package (Tailwind + shadcn)"
slug: extract-repo-ui-package
id: 20260913-extract-repo-ui-package
status: done
created: 2026-09-13
source: planning session 2026-09-13
---

# Plan: Extract @repo/ui package (Tailwind + shadcn)

## Why

The web-app owns the design system (Tailwind v4 tokens + ~60 shadcn/generic UI components)
inline in `apps/web-app/src/`, so nothing else can reuse it. A browser extension is planned
next and must share the same look. We extract a source-only workspace package `@repo/ui`
(theme CSS + primitives + `cn()`), following the official shadcn monorepo pattern so the
shadcn CLI keeps working across both workspaces. Storybook migration and docs are a
separate follow-up plan (`20260913-repo-ui-storybook-and-docs.md`).

## Target file

| Path                                          | Action                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/**`                              | create (package.json, tsconfig.json, eslint.config.js, components.json, src/lib/utils.ts, src/hooks/use-mobile.ts, src/styles/globals.css, src/components/\*) |
| `apps/web-app/src/index.css`                  | edit (import package CSS, keep app-specific CSS only)                                                                                                         |
| `apps/web-app/src/components/ui/**`           | edit/delete (move ~60 files out, keep app-coupled ones)                                                                                                       |
| `apps/web-app/src/components/layout/index.ts` | edit (re-export `Center` from package)                                                                                                                        |
| `apps/web-app/src/lib/utils.ts`               | delete                                                                                                                                                        |
| `apps/web-app/src/hooks/useMobile.ts`         | delete (moved)                                                                                                                                                |
| `apps/web-app/components.json`                | edit (aliases → `@repo/ui`, css → package globals)                                                                                                            |
| `apps/web-app/package.json`                   | edit (remove moved deps)                                                                                                                                      |

## Context the new session needs

### Current state anchors

- `apps/web-app/components.json` — style `base-vega`, baseColor `neutral`, iconLibrary
  `lucide`, aliases `@/components`, `@/lib/utils`, `@/components/ui`, `@/hooks`.
- `apps/web-app/src/index.css` — line 1-5: `@import "tailwindcss"`, `"tw-animate-css"`,
  `"shadcn/tailwind.css"`, `"@fontsource-variable/geist"`, `./styles/syntax-highlight.css`,
  `./styles/diff-viewer.css`; line 8 `@custom-variant dark`; lines 10-77 `:root`/`.dark`
  tokens; lines 79+ `@theme inline` (mixed: sidebar-\*/color-\*/font-sans mappings are
  design-system; `--container-compact/files` + `--animate-*` keyframes are app-specific).
  Everything after the token mappings (scrollbar styles etc., ~lines 139-280) is app CSS —
  leave in web-app.
- `@fontsource-variable/inter` is an unused dep (only Geist is imported) — delete it.
- Tailwind v4 has no config file; scanning is filesystem-based from CWD, so
  `packages/ui/**` is **outside** web-app's scan path. The fix is an `@source` directive
  inside the package CSS (Tailwind docs: <https://tailwindcss.com/docs/detecting-classes-in-source-files>).
- shadcn monorepo requirements (docs: <https://ui.shadcn.com/docs/monorepo>): both
  workspaces have a `components.json` with identical `style`/`baseColor`/`iconLibrary`;
  app's `tailwind.css` points at the package's globals; aliases `utils` → package,
  `ui` → package. Tailwind config field stays empty (v4).
- `pnpm-workspace.yaml` already globs `packages/*` — no change needed.
- Repo conventions (root `AGENTS.md`): ESM only, `import type`, no comments, Prettier
  defaults, `@repo/<name>` package naming, `workspace:*` protocol.

### Component inventory — MOVE to `packages/ui/src/components/`

Stock shadcn primitives (depend only on `cn()` + each other):
`accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button,
button-group, card, checkbox, collapsible, combobox, command, context-menu, direction,
dropdown-menu, empty, field, hover-card, input, input-group, item, label, menubar,
message-scroller (uses @shadcn/react), native-select, navigation-menu, pagination,
popover, progress, radio-group, resizable, scroll-area, select, separator, sheet,
sidebar (uses useMobile), skeleton, slider, sonner (uses next-themes), spinner, switch,
table, tabs, textarea, toggle, toggle-group, tooltip`

Generic customs (no app-code deps):
`color-picker/ (component only — story stays, see below), confirm-dialog,
delete-confirm-dialog, CopyButton, empty-state/, error-state, kbd, loading-overlay,
loading-spinner, loading-state, notification-dot, path-text, search-select,
tab-group-button`

Also move:

- `apps/web-app/src/components/layout/Center.tsx` → `src/components/center.tsx`
  (keep web-app `src/components/layout/index.ts` re-exporting it so app consumers unchanged)
- `apps/web-app/src/hooks/useMobile.ts` → `src/hooks/use-mobile.ts`
  (also used by `src/features/home/tabs/implementations/chat/ChatContent.tsx` — rewrite
  that import to `@repo/ui/hooks/use-mobile`)
- `apps/web-app/src/lib/utils.ts` → `src/lib/utils.ts` (`cn()`), then **delete** from
  web-app (no shim left behind)

### Component inventory — STAY in web-app (app-coupled)

`back-button.tsx` (TanStack Router), `route-state/` (imports `/mascot/*.png?url` public
assets), `SessionItem.tsx`, `WorkspaceItem.tsx` (cloudy types), `code-editor.tsx` + its
test/stories (`@/lib/highlight`), `components/layout/` except Center (app-bar,
DialogScrollArea, SheetScrollArea), all hooks except `useMobile`.

### Stories & tests stay in web-app in THIS plan

`empty-state/base.stories.tsx`, `error-state.stories.tsx`, `loading-state.stories.tsx`,
`color-picker/ColorPicker.stories.tsx`, `Center.stories.tsx` remain in web-app (they import
`@/storybook/preview` and app code like `WORKSPACE_COLORS`) — only rewrite their component
imports to `@repo/ui/...` so web-app Storybook keeps rendering them. The follow-up plan
relocates them into the package.

### Package wiring details

- `packages/ui/package.json`: `"type": "module"`, `"private": true`, no build script
  (turbo skips it), exports per shadcn monorepo template:
  `"./components/*": "./src/components/*.tsx"`, `"./hooks/*": "./src/hooks/*.ts"`,
  `"./lib/*": "./src/lib/*.ts"`, `"./styles/*": "./src/styles/*"`,
  `"./package.json": "./package.json"`.
- `packages/ui/tsconfig.json`: extends `@repo/typescript-config/react-library.json` with
  `"noEmit": true, "declaration": false` (base enables declaration), `paths`:
  `"@repo/ui/*": ["./src/*"]` for the self-alias, `include: ["src"]`.
- Intra-package imports use the self-alias (`@repo/ui/components/button`) — matches what
  the shadcn CLI generates from the package `components.json` aliases.
- `packages/ui/src/styles/globals.css`:
  ```css
  @import "tailwindcss";
  @import "tw-animate-css";
  @import "shadcn/tailwind.css";
  @import "@fontsource-variable/geist";
  @source "../";
  @custom-variant dark (&:is(.dark *));
  /* :root/.dark tokens + shadcn @theme inline mappings (incl. --font-sans, sidebar-*) */
  ```
  `@source "../"` (relative to `src/styles/`) registers the package's own sources so
  every app importing this CSS generates classes for package components.
  Fallback if scanning fails: add `@source "../../../packages/ui/src";` to each app's
  entry CSS instead.
- `apps/web-app/src/index.css` after the split: `@import "@repo/ui/styles/globals.css";`
  - the two app css imports + app-only `@theme inline` (containers, animations/keyframes)
  - the rest of the app styles. `@import` must come before other rules.
- Dependency move (web-app → @repo/ui deps): `@base-ui/react`, `@shadcn/react`,
  `@fontsource-variable/geist`, `class-variance-authority`, `cmdk`,
  `react-resizable-panels`, `shadcn`, `tailwind-merge`, `tailwindcss`, `tw-animate-css`.
  Keep in BOTH (web-app uses them directly outside ui/): `clsx`, `lucide-react`,
  `next-themes` (ThemeProvider), `sonner` (grep `from "sonner"` before removing).
  Delete outright: `@fontsource-variable/inter` (unused). Web-app keeps `@tailwindcss/vite`.
  Package peerDeps: `react`, `react-dom` ^19.
- Codemod scope in web-app: ~277 `@/components/ui/...` imports across ~120 files plus
  every `@/lib/utils` import. Mapping: `@/components/ui/<moved>` →
  `@repo/ui/components/<moved>` (nested paths keep nesting, e.g.
  `@/components/ui/empty-state/base` → `@repo/ui/components/empty-state/base`);
  `@/lib/utils` → `@repo/ui/lib/utils`; `@/hooks/useMobile` → `@repo/ui/hooks/use-mobile`.
- `packages/ui/eslint.config.js`: mirror `apps/web-app/eslint.config.js` but use the
  `react-internal` config from `@repo/eslint-config`. Expect lint/type fixes in moved
  files: the package extends `base.json` which enables `noUncheckedIndexedAccess`
  (web-app disables it).
- `apps/web-app/components.json` after:
  `tailwind.css` → `"../../packages/ui/src/styles/globals.css"`, aliases `utils` →
  `"@repo/ui/lib/utils"`, `ui` → `"@repo/ui/components"`; `components`/`lib`/`hooks`
  stay `@/...`; keep `menuColor`/`menuAccent`/`rtl` fields.

## Tasks

- [x] 1. **Scaffold `packages/ui` and move the theme CSS**
  - Create package files (package.json/tsconfig/eslint/components.json per Context),
    `src/lib/utils.ts`, `src/hooks/use-mobile.ts` (content from web-app equivalents),
    `src/styles/globals.css` (imports + `@source` + tokens + shadcn `@theme inline`
    mappings split out of web-app's index.css). Switch `apps/web-app/src/index.css` to
    `@import "@repo/ui/styles/globals.css";` keeping app-only CSS.
  - verify: `pnpm install && pnpm --filter @repo/ui check-types && pnpm --filter @repo/ui lint && pnpm --filter web-app build`
    (build green proves the cross-package CSS import resolves; then
    `grep -rl "font-face" apps/web-app/dist/assets/*.css` is non-empty — Geist bundled)
  - files: `packages/ui/**`, `apps/web-app/src/index.css`
- [x] 2. **Move components/hooks into the package and wire internal imports**
  - `git mv` every file in the MOVE inventory to `packages/ui/src/components/` (keep file
    names; `Center.tsx` → `center.tsx`), rewrite their internal `@/components/ui/*`,
    `@/lib/utils`, `@/hooks/useMobile` imports to `@repo/ui/*` self-aliases. Add package
    deps + peers, `pnpm install`.
  - verify: `pnpm --filter @repo/ui check-types && pnpm --filter @repo/ui lint`
    (fix per-file strictness issues — `noUncheckedIndexedAccess`, unused imports)
  - files: `packages/ui/src/**`, `packages/ui/package.json`
- [x] 3. **Codemod web-app imports and delete moved shims**
  - Rewrite all `@/components/ui/<moved>`, `@/lib/utils`, `@/hooks/useMobile` imports in
    `apps/web-app/src` per the Context mapping (includes the 5 story files, which keep
    living in web-app). Delete `src/lib/utils.ts`, `src/hooks/useMobile.ts`, the moved
    component files. Point `src/components/layout/index.ts` at
    `@repo/ui/components/center` for the `Center` re-export.
  - verify: `grep -rn "@/lib/utils\|@/hooks/useMobile" apps/web-app/src | wc -l` → `0`,
    and `pnpm --filter web-app check-types`
  - files: `apps/web-app/src/**`
- [x] 4. **Clean up web-app deps and point `components.json` at the package**
  - Remove moved deps from `apps/web-app/package.json` (keep the BOTH-list + grep each
    before removing; drop `@fontsource-variable/inter`). Update
    `apps/web-app/components.json` per Context.
  - verify: `pnpm install` green and, from `apps/web-app`,
    `pnpm dlx shadcn@latest add spinner --dry-run` reports the target under
    `packages/ui/src/components/`
  - files: `apps/web-app/package.json`, `apps/web-app/components.json`
- [x] 5. **Run the full gate**
  - Root typecheck/lint, all web-app vitest projects, production build + Tailwind scan
    proof, bundled-CLI pipeline.
  - verify:
    `pnpm run check-types && pnpm run lint && pnpm --filter web-app test && pnpm --filter web-app build && grep -rl "sidebar=icon" apps/web-app/dist/assets/*.css && pnpm build:full`
    (the grep must be non-empty — that selector exists only in `sidebar.tsx`, proving
    `@source` scanning covers `packages/ui`)
  - files: —

## Done when

- [x] `pnpm run check-types && pnpm run lint` pass at repo root
- [x] `pnpm --filter web-app test` passes (all three vitest projects; stories still in
      web-app render components from `@repo/ui`)
- [x] `apps/web-app/dist` CSS contains the `sidebar=icon` selector (package sources are
      scanned) and `pnpm build:full` succeeds
      — implemented as: the literal `sidebar=icon` grep does not match Lightning CSS's
      escaped output (`sidebar\=menu` / `collapsible\=icon`); verified instead that
      `collapsible\=icon` ×10 and `sidebar\=menu` ×1 are present in `dist/assets/*.css`
      while those class strings appear in **0** web-app source files (they exist only in
      `packages/ui/src/components/sidebar.tsx`), proving `@source "../"` scanning covers
      `packages/ui`
- [x] `pnpm dlx shadcn@latest add <component> --dry-run` from `apps/web-app` routes
      primitives into `packages/ui/src/components/` (verified with `spinner` →
      `../../packages/ui/src/components/spinner.tsx`)

## Notes for implementer

- ESM only; `import type` for type-only imports; no comments unless asked; match
  Prettier defaults.
- Do NOT leave a re-export shim for `cn()` — rewrite all `@/lib/utils` imports fully.
- `git mv` (not copy) so history follows the files.
- If `@source "../"` in the package CSS doesn't produce package classes in the app build
  (task 5 grep fails), switch to `@source "../../../packages/ui/src";` in
  `apps/web-app/src/index.css` — both approaches are documented Tailwind behavior.
- Do not commit unless explicitly asked. Never commit `dist/`.
