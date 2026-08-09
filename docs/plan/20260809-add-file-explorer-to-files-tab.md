---
title: Add file explorer to combined Files tab
slug: add-file-explorer-to-files-tab
id: 20260809-add-file-explorer-to-files-tab
status: ready
created: 2026-08-09
source: planning session 2026-08-09
---

# Plan: Add file explorer to combined Files tab

## Why

The existing `files` tab (`type: "files"`) only shows uncommitted VCS diffs — there is no
way to browse the workspace's file tree or read file contents from the UI. We want one
"Files" tab that combines a **file explorer** (tree + content preview, via opencode SDK
`file.list`/`file.read`) with the existing **Changes** (diff) view, toggled by a segmented
control at the top. `FilesData` shape stays `{ workspaceId, directory }` so no tab-store
migration is needed.

## Target file

| Path                                                                              | Action                                                       |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `apps/web-app/src/lib/opencode/query-keys.ts`                                     | edit — add `fileKeys`                                        |
| `apps/web-app/src/hooks/queries/useFiles.ts`                                      | edit — add `useFileList`, `useFileRead`                      |
| `apps/web-app/src/features/home/tabs/implementations/files/FileTree.tsx`          | create — lazy-expanding tree                                 |
| `apps/web-app/src/features/home/tabs/implementations/files/FilePreview.tsx`       | create — content viewer                                      |
| `apps/web-app/src/features/home/tabs/implementations/files/FilesExplorer.tsx`     | create — explorer shell (tree + preview)                     |
| `apps/web-app/src/features/home/tabs/implementations/files/FilesChanges.tsx`      | create — extracted current Changes body                      |
| `apps/web-app/src/features/home/tabs/implementations/files/FilesContent.tsx`      | edit — add mode toggle, delegate to the two sub-views        |
| `apps/web-app/src/features/home/tabs/implementations/files/meta.ts`               | edit — label "Files", title, icon                            |
| `apps/web-app/src/features/home/tabs/implementations/files/FilesCreateDialog.tsx` | edit — copy tweak                                            |
| `apps/web-app/src/lib/opencode/handle-global-event.ts`                            | edit (optional) — invalidate file/vcs keys on `session.idle` |

Eight core files, but all tightly coupled under one feature folder + its data layer.
Single-feature scope, executed in dependency order so each step leaves the build green.

## Context the new session needs

- **Tab abstraction:** `apps/web-app/AGENTS.md` "The Tab abstraction" section is the
  authoritative guide. Templates live under
  `apps/web-app/src/features/home/tabs/implementations/<name>/` and are registered in
  `apps/web-app/src/features/home/tabs/template/registry.ts`. Adding/editing a template
  auto-extends the `Tab` union — no manual type edits. The `files` template already
  exists; this plan **evolves it in place** (keeps `type: "files"`).
- **Current `files` tab is Changes-only.** Read
  `apps/web-app/src/features/home/tabs/implementations/files/FilesContent.tsx:33` — it
  calls `useVcsDiff({ directory })` (defined at
  `apps/web-app/src/hooks/queries/useFiles.ts:5`) and renders a sidebar (`FilesList.tsx`)
  - diff detail (`FileDetail.tsx` using `DiffViewer`). The whole Changes body (roughly
    lines 98–184) will move verbatim into a new `FilesChanges.tsx`.
- **opencode SDK v2 file APIs (not yet used in the app).** Available on `getOcClient()`:
  - `oc.file.list({ directory, path })` → `FileNode[]` where
    `FileNode = { name, path, absolute, type: "file"|"directory", ignored }`. Returns
    **one level only** — that's why the tree must lazy-expand.
  - `oc.file.read({ directory, path })` → `FileContent = { type: "text"|"binary",
content, diff?, patch?, encoding?, mimeType? }`.
  - `oc.file.status({ directory })` → `File[] = { path, added, removed, status }`
    (optional — for badging changed files in the tree).
  - Types import from `@opencode-ai/sdk/v2` (e.g.
    `import type { FileNode, FileContent } from "@opencode-ai/sdk/v2"`), matching the
    existing `VcsFileDiff` import in `FileDetail.tsx:1`.
- **Hook pattern to mirror:** `useVcsDiff` at `useFiles.ts:5` — `useQuery` + `getOcClient()`
  - `getErrorMessage(result.error as SdkError)` + throw, `enabled: !!directory`. Copy this
    shape for the two new hooks.
- **Query-key pattern:** `vcsKeys` at `apps/web-app/src/lib/opencode/query-keys.ts:45`.
  Add a sibling `fileKeys` under the namespace `["files", ...]`. This does **not** collide
  with the `files` _tab_ concept — tabs live in Zustand (`tabStore`), not React Query.
- **Client wiring:** `getOcClient()` from `@/lib/opencode` returns the cached
  `OpencodeClient`. The proxy already passes `directory` as a query param; no server
  changes needed.
- **Content rendering pattern to mirror:** `apps/web-app/src/components/file-update-viewer/index.tsx:65`
  (`renderContent`) shows the exact CodeBlock-vs-DiffViewer decision: text →
  `<CodeBlock headless>{content}</CodeBlock>`, edit/patch → `<DiffViewer .../>`. Reuse
  both from `@/components/markdown/`. **Do not touch `file-update-viewer` itself** — it is
  intentionally left orphaned per this plan's decision.
- **State components are mandatory.** Per `apps/web-app/AGENTS.md` "State components":
  every loading/error/empty branch in new components must use `LoadingState` /
  `ErrorState` / `EmptyState` from `@/components/ui/...`. Use the shared-wrapper pattern
  (compute one `content` node + single return) when branches share a header/wrapper.
- **Responsive shell:** `FilesContent.tsx` already uses `useDeviceType()` + `Sheet` for
  the sidebar on small screens (lines 38–40, 165–183). The new `FilesExplorer.tsx` must
  mirror this exact responsive structure for visual consistency between the two modes.
- **Conventions:** no comments unless asked; `import type` for type-only imports
  (`verbatimModuleSyntax` is on); individual Zustand selectors (not relevant here — no
  new store); ESM only. Run lint + typecheck before finishing.

## Tasks

- [ ] 1. Add `fileKeys` to the opencode query-keys file
  - verify: `pnpm --filter web-app check-types` passes; `fileKeys.list("d","p")` returns
    `["files","list","d","p"]`
  - files: `apps/web-app/src/lib/opencode/query-keys.ts`
- [ ] 2. Add `useFileList` and `useFileRead` hooks mirroring `useVcsDiff`
  - verify: `pnpm --filter web-app check-types` passes; both hooks accept
    `{ directory, path }` and are `enabled: !!directory && !!path`
  - files: `apps/web-app/src/hooks/queries/useFiles.ts`
- [ ] 3. Create `FileTree.tsx` — lazy-expanding directory tree
  - verify: `pnpm --filter web-app check-types` passes; component renders root via
    `useFileList({ path: "." })` and fetches children on dir expand; uses
    `LoadingState`/`ErrorState`/`EmptyState` (size `inline`) per node
  - files: `apps/web-app/src/features/home/tabs/implementations/files/FileTree.tsx`
- [ ] 4. Create `FilePreview.tsx` — content viewer for a selected file
  - verify: `pnpm --filter web-app check-types` passes; uses `useFileRead`; text →
    `<CodeBlock headless>`, binary → `<EmptyState title="Binary file" />`
  - files: `apps/web-app/src/features/home/tabs/implementations/files/FilePreview.tsx`
- [ ] 5. Create `FilesExplorer.tsx` — explorer shell composing FileTree + FilePreview
  - verify: `pnpm --filter web-app check-types` passes; mirrors the responsive sidebar +
    `Sheet` layout of the current `FilesContent.tsx`
  - files: `apps/web-app/src/features/home/tabs/implementations/files/FilesExplorer.tsx`
- [ ] 6. Extract the current Changes body into `FilesChanges.tsx` (no behavior change)
  - verify: `pnpm --filter web-app check-types` passes; `FilesChanges` receives
    `{ directory }` and renders `FilesList` + `FileDetail` exactly as before
  - files: `apps/web-app/src/features/home/tabs/implementations/files/FilesChanges.tsx`
- [ ] 7. Wire the mode toggle into `FilesContent.tsx`: add `mode: "explorer"|"changes"`
     state (default `"changes"`), a segmented control at the top, render
     `<FilesExplorer/>` or `<FilesChanges/>` below; keep the directory null-guard and
     shared shell
  - verify: `pnpm --filter web-app check-types` passes; toggling switches the body without
    unmounting the tab
  - files: `apps/web-app/src/features/home/tabs/implementations/files/FilesContent.tsx`
- [ ] 8. Update tab metadata: `meta.ts` `label` → `"Files"`, `FilesTabTitle` → `"Files"`,
     pick an icon (`FolderOpen` or keep `FileDiff`); `FilesCreateDialog.tsx` description
     → "browse files and changes"
  - verify: tab bar shows "Files"; new-tab dialog copy updated
  - files: `apps/web-app/src/features/home/tabs/implementations/files/meta.ts`,
    `apps/web-app/src/features/home/tabs/implementations/files/FilesCreateDialog.tsx`
- [ ] 9. (Optional) Invalidate `vcsKeys.diff(event.directory)` and `fileKeys.*` in the
     `session.idle` branch of `handle-global-event.ts` so Changes/Explorer refresh after
     AI edits files
  - verify: after a chat session edits files, the Files tab shows fresh data without
    manual reload
  - files: `apps/web-app/src/lib/opencode/handle-global-event.ts`
- [ ] 10. Full check
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types` clean;
    `pnpm --filter web-app exec vitest run` green
  - files: —

## Done when

- [ ] Opening the Files tab shows a segmented toggle with "Explorer" and "Changes"
- [ ] "Changes" mode renders the previous VCS diff view unchanged (sidebar + DiffViewer)
- [ ] "Explorer" mode shows a lazy-expanding file tree; selecting a text file renders its
      content via `CodeBlock`; binary files show an `EmptyState`
- [ ] Tab bar label is "Files"; new-tab dialog copy mentions browse + changes
- [ ] `pnpm --filter web-app lint && pnpm --filter web-app check-types` clean
- [ ] `pnpm --filter web-app exec vitest run` green (no new tests required for v1; the
      tab-store shape is unchanged so existing tests stay green)

## Notes for implementer

- **Multi-file scope flag:** this plan touches ~8 files but they are one tightly-coupled
  feature (the `files` tab + its data layer). Execute the tasks in order — each leaves the
  build green. Do not bundle unrelated refactors in.
- **`oc.file.list` returns one level only** — lazy expansion is mandatory, not optional.
  Do not attempt a recursive preload.
- **Do not touch `src/components/file-update-viewer/`** — it is intentionally left
  orphaned. Build the explorer fresh with `CodeBlock` + `DiffViewer` directly.
- **No tab-store migration:** `FilesData = { workspaceId, directory }` is unchanged. Do
  not bump `tabStore` version. The new `mode` is local component state (resets on tab
  reopen) — if you later want it persisted, _then_ bump the version and add a migrate
  branch.
- **State components are mandatory** — never hand-roll inline loading/error/empty JSX. See
  the "State components" + "Shared wrapper across state branches" sections of
  `apps/web-app/AGENTS.md`.
- **`import type` only** for SDK types (`FileNode`, `FileContent`) — `verbatimModuleSyntax`
  is on.
- Keep the Explorer's responsive shell (sidebar + `Sheet` on small screens) visually
  consistent with the Changes view so toggling modes doesn't jump layout.
