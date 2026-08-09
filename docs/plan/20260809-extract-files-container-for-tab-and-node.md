---
title: Extract files tab UI into shared FilesContainer for tab + node reuse
slug: extract-files-container-for-tab-and-node
id: 20260809-extract-files-container-for-tab-and-node
status: ready
created: 2026-08-09
source: planning session 2026-08-09
---

# Plan: Extract files tab UI into shared FilesContainer for tab + node reuse

## Why

The `files` tab UI (mode switcher + Changes/Explorer/Search bodies) is tightly coupled to the
Tab abstraction — it lives under `tabs/implementations/files/` and its entry component
(`FilesContent.tsx`) reads `tab.data.directory` and `useTabStore`. We want to add a `files`
**desk node** that renders the exact same surface inside a `WindowFrame`, without duplicating
~700 lines of code. The prerequisite is a shared, tab-agnostic entry component
(`FilesContainer`) that both the tab wrapper and the future node wrapper can render — exactly
the pattern `chat` already established with `ChatContainer`. This plan does **only the
extraction**; the node itself is a separate follow-up plan.

## Target file

| Path                                                                              | Action                                                  |
| --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `apps/web-app/src/components/files/FilesContainer.tsx`                            | create — shared entry owning the 3-mode switcher        |
| `apps/web-app/src/components/files/FilesChanges.tsx`                              | create — moved verbatim from tab folder                 |
| `apps/web-app/src/components/files/FilesExplorer.tsx`                             | create — moved verbatim                                 |
| `apps/web-app/src/components/files/FilesSearch.tsx`                               | create — moved verbatim                                 |
| `apps/web-app/src/components/files/FilesList.tsx`                                 | create — moved verbatim                                 |
| `apps/web-app/src/components/files/FileDetail.tsx`                                | create — moved verbatim                                 |
| `apps/web-app/src/components/files/FileTree.tsx`                                  | create — moved verbatim                                 |
| `apps/web-app/src/components/files/FilePreview.tsx`                               | create — moved verbatim                                 |
| `apps/web-app/src/components/files/FileSearchInput.tsx`                           | create — moved verbatim                                 |
| `apps/web-app/src/components/files/FileSearchResults.tsx`                         | create — moved verbatim                                 |
| `apps/web-app/src/features/home/tabs/implementations/files/FilesContent.tsx`      | edit — slim to thin wrapper mirroring `ChatContent.tsx` |
| `apps/web-app/src/features/home/tabs/implementations/files/FilesChanges.tsx`      | delete (moved)                                          |
| `apps/web-app/src/features/home/tabs/implementations/files/FilesExplorer.tsx`     | delete (moved)                                          |
| `apps/web-app/src/features/home/tabs/implementations/files/FilesSearch.tsx`       | delete (moved)                                          |
| `apps/web-app/src/features/home/tabs/implementations/files/FilesList.tsx`         | delete (moved)                                          |
| `apps/web-app/src/features/home/tabs/implementations/files/FileDetail.tsx`        | delete (moved)                                          |
| `apps/web-app/src/features/home/tabs/implementations/files/FileTree.tsx`          | delete (moved)                                          |
| `apps/web-app/src/features/home/tabs/implementations/files/FilePreview.tsx`       | delete (moved)                                          |
| `apps/web-app/src/features/home/tabs/implementations/files/FileSearchInput.tsx`   | delete (moved)                                          |
| `apps/web-app/src/features/home/tabs/implementations/files/FileSearchResults.tsx` | delete (moved)                                          |

Ten new files under one new folder + one edit + ten deletes. Single-refactor scope: one
cohesive extraction, executed in copy→repoint→delete order so each task leaves the build green.
`meta.ts`, `FilesCreateDialog.tsx`, `index.ts` (tab barrel), and the `FilesData` shape are
**untouched** — no tab-store migration.

## Context the new session needs

- **Canonical precedent — the `chat` split.** Chat already solved this exact problem. Read
  these three files first; they ARE the spec:
  - `apps/web-app/src/components/chat/ChatContainer.tsx:16` — shared entry. Prop signature:
    `{ workspace?: Workspace | null; directory: string; sessionId: string | null; onSessionChange? }`.
    Owns the entire chat surface; takes plain props, no `tab`/`node` awareness.
  - `apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx:12` — the tab
    wrapper (38 lines). Pulls `directory`/`sessionId` from `tab.data`, guards no-directory
    (returns `<ErrorState onRetry={() => useTabStore.getState().removeTab(tab.id)} />`), then
    renders `<ChatContainer .../>`. **`FilesContainer` is the analog of `ChatContainer`;
    the new `FilesContent.tsx` is the analog of `ChatContent.tsx`.**
  - `apps/web-app/src/features/desk/nodes/implementations/chat-node/ChatNode.tsx:21` — the node
    wrapper (NOT built in this plan, but read it to see why the extraction is shaped this way:
    it wraps the same `<ChatContainer>` in `<WindowFrame>`).
- **Decision: the 3-mode switcher (Changes/Explorer/Search) lives INSIDE `FilesContainer`.**
  User explicitly chose this (DRY option, faithful to chat). `FilesContainer` therefore owns
  the `useState<FilesMode>("changes")` + the `<Tabs>`/`<TabsList>`/`<TabsTrigger>` block + the
  conditional render of `<FilesChanges/>`/`<FilesExplorer/>`/`<FilesSearch/>`. The tab wrapper
  does NOT touch the switcher. The future node wrapper will get all 3 modes for free.
- **Decision: no-directory guard stays in the tab wrapper, NOT in `FilesContainer`.** Matches
  `ChatContainer` (which always receives a valid `directory`). `FilesContainer` takes
  `directory: string` (non-null) and assumes validity. The tab wrapper (`FilesContent.tsx`)
  keeps the `if (!directory) return <ErrorState ...removeTab.../>` early return.
- **The current `FilesContent.tsx` body** (`apps/web-app/src/features/home/tabs/implementations/files/FilesContent.tsx:17`)
  is the source to split: lines 18–19 (`directory`, `mode` state), 21–28 (no-directory guard —
  STAYS in wrapper), 30–60 (the `<div className="flex h-full flex-col">` shell + `<Tabs>` +
  conditional mode render — MOVES into `FilesContainer`, with `tab` references stripped and
  `directory` becoming a prop).
- **The 9 leaf components move VERBATIM — zero content edits.** They only import from (a)
  `@/...` aliases, which are path-agnostic, and (b) each other via `./Sibling`, which stays
  valid because they all move together into the same new folder. Confirmed via grep: the ONLY
  consumer of these 9 files outside themselves is `FilesContent.tsx`. No other feature
  imports them. Safe to relocate as a unit.
- **What stays in the tab folder (do not move):**
  - `meta.ts` — defines `FilesData = { workspaceId: string | null; directory: string }` and
    `filesTemplate` (references `FilesContent` + `FilesCreateDialog`). Unchanged.
  - `FilesCreateDialog.tsx` — tab-only; wires `useTabStore.addTab("files", ...)`. The future
    node will have its own create dialog (like `WebviewNodeCreateDialog`), so this stays
    tab-side. The shared inner piece it uses (`WorkspaceSelectStep`) is already shared at
    `@/features/workspace/WorkspaceSelectStep`.
  - `index.ts` — tab barrel: `export * from "./FilesContent"; export * from "./meta";`.
    Still correct after extraction (both exports remain). Unchanged.
- **`FilesData` shape is unchanged → NO `tabStore` version bump, NO migration.** This is a
  pure UI relocation; persisted tabs keep working as-is.
- **Conventions** (from `apps/web-app/AGENTS.md`): TypeScript strict, ESM-only, `import type`
  for type-only imports (`verbatimModuleSyntax` is on), no comments unless asked, `cn(...)` for
  conditional classes. State components (`EmptyState`/`ErrorState`/`LoadingState`) already used
  inside the leaves — no changes needed. Cross-feature shared UI belongs in `src/components/`
  (the documented home, where `chat/`, `markdown/`, `terminal/` already live).

## Tasks

- [x] 1. **Create `src/components/files/` with `FilesContainer.tsx` (new entry) + the 9 leaf
     components copied verbatim from the tab folder.** `FilesContainer` owns `useState<FilesMode>("changes")` + the `<Tabs>` switcher + conditional mode render (the body of current `FilesContent.tsx` lines 30–60, with `tab`/`useTabStore` stripped and `directory` as a prop). The 9 leaves are byte-identical copies — their `@/` and `./sibling` imports stay valid at the new path. Leave the tab-folder originals in place for now.
  - verify: `pnpm --filter web-app check-types && pnpm --filter web-app lint` pass (new module compiles; tab folder untouched and still the active code path)
  - files: `apps/web-app/src/components/files/FilesContainer.tsx`,
    `apps/web-app/src/components/files/FilesChanges.tsx`,
    `apps/web-app/src/components/files/FilesExplorer.tsx`,
    `apps/web-app/src/components/files/FilesSearch.tsx`,
    `apps/web-app/src/components/files/FilesList.tsx`,
    `apps/web-app/src/components/files/FileDetail.tsx`,
    `apps/web-app/src/components/files/FileTree.tsx`,
    `apps/web-app/src/components/files/FilePreview.tsx`,
    `apps/web-app/src/components/files/FileSearchInput.tsx`,
    `apps/web-app/src/components/files/FileSearchResults.tsx`
- [x] 2. **Repoint `FilesContent.tsx` to the shared module and delete the orphaned tab-folder
     leaves.** Rewrite `FilesContent.tsx` to mirror `ChatContent.tsx`: keep the `directory` extraction + the no-directory `<ErrorState onRetry={removeTab}/>` guard, then render `<FilesContainer directory={directory} />`. Remove the inline `<Tabs>`/`mode` state (now in `FilesContainer`). Then delete the 9 leaf files from `tabs/implementations/files/`.
  - verify: `pnpm --filter web-app check-types && pnpm --filter web-app lint` pass; `apps/web-app/src/features/home/tabs/implementations/files/` contains only `meta.ts`, `FilesContent.tsx`, `FilesCreateDialog.tsx`, `index.ts`
  - files: `apps/web-app/src/features/home/tabs/implementations/files/FilesContent.tsx` (edit);
    `FilesChanges.tsx`, `FilesExplorer.tsx`, `FilesSearch.tsx`, `FilesList.tsx`, `FileDetail.tsx`, `FileTree.tsx`, `FilePreview.tsx`, `FileSearchInput.tsx`, `FileSearchResults.tsx` in the same folder (delete)
- [x] 3. **Full check + manual smoke test.** (automated checks green: check-types, lint, vitest 680/680; manual browser smoke test pending)
  - verify: `pnpm --filter web-app check-types && pnpm --filter web-app lint && pnpm --filter web-app exec vitest run` all green; open a Files tab and confirm (a) the 3-mode toggle switches between Changes/Explorer/Search, (b) each mode renders its data as before, (c) the responsive sidebar + `Sheet` still works on narrow widths, (d) a files tab with no `directory` shows the error state with a retry that closes the tab
  - files: —

Order rationale: task 1 ends green (new module unused but compiling). Task 2 ends green
(consumer switched, orphans removed). Task 3 is the human confirmation that the extraction is
behavior-preserving — no shell command can assert "the Explorer tree still expands".

## Done when

- [x] `apps/web-app/src/components/files/FilesContainer.tsx` exists and renders the 3-mode
      switcher from a `directory: string` prop (no `tab`/`node` dependency)
- [x] `FilesContent.tsx` is a thin wrapper under ~30 lines that mirrors `ChatContent.tsx`
      (guard + `<FilesContainer directory={directory} />`)
- [x] The 9 leaf components live ONLY under `src/components/files/` (none left in the tab folder)
- [x] `meta.ts`, `FilesCreateDialog.tsx`, tab `index.ts`, and the `FilesData` shape are unchanged
- [ ] Opening a Files tab behaves identically to before extraction (all 3 modes, responsive
      sidebar, no-directory error)
- [x] `pnpm --filter web-app check-types && pnpm --filter web-app lint && pnpm --filter web-app exec vitest run` are clean
- [x] A future `files-node` can be built by wrapping `<FilesContainer directory={...} />` in
      `<WindowFrame>` with zero duplication (verified by reading the new module, not by building it — that's the follow-up plan)

## Notes for implementer

- **Read `ChatContainer.tsx` + `ChatContent.tsx` first.** They are the spec. The new
  `FilesContainer` is structurally `ChatContainer`'s counterpart; the new `FilesContent.tsx`
  is structurally `ChatContent.tsx`'s counterpart.
- **The 9 leaf moves are verbatim copies in task 1, deleted in task 2** — this copy-then-delete
  sequence keeps the build green between tasks. Do NOT `git mv` in one step; that leaves a red
  window where `FilesContent.tsx` imports broken paths.
- **Multi-file scope flag:** this plan touches ~20 file paths but it is ONE cohesive extraction
  (create shared module → repoint single consumer → remove originals). Do not bundle unrelated
  refactors in. The node itself is explicitly out of scope — open a follow-up plan titled
  "Add files desk node" once this is done.
- **Do NOT add a barrel `index.ts` to `src/components/files/`** unless a second consumer needs
  it. `chat/` has no barrel; consumers import `@/components/chat/ChatContainer` directly.
  Match that: `import { FilesContainer } from "@/components/files/FilesContainer"`.
- **No comments unless asked. No `.bak` files.** ESM only, `import type` for type-only.
- **No tab-store migration.** `FilesData` is unchanged.
