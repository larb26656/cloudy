---
title: Add FilesContainer Storybook coverage
slug: add-files-container-storybook-coverage
id: 20260812-add-files-container-storybook-coverage
status: ready
created: 2026-08-12
source: planning session 2026-08-12
---

# Plan: Add FilesContainer Storybook coverage

## Why

The shared Files surface has Changes, Explorer, Search, loading, empty, error, and compact responsive behavior, but none of these integrated states can currently be reviewed in Storybook. Add one focused story module around `FilesContainer` so the whole file-browsing experience can be inspected and its main interactions can run in the Storybook Vitest project without a live opencode server.

## Target file

| Path                                                           | Action |
| -------------------------------------------------------------- | ------ |
| `apps/web-app/src/components/files/FilesContainer.stories.tsx` | create |

## Context the new session needs

- Read `AGENTS.md`, `apps/web-app/AGENTS.md`, and `apps/web-app/DESIGN.md` before implementing. Storybook 10 uses the type-safe `preview.meta(...)` / `meta.story(...)` API documented in `apps/web-app/AGENTS.md`; do not use the classic `Meta` / `StoryObj` pattern.
- `apps/web-app/src/components/files/FilesContainer.tsx:14-46` is the integration boundary. It owns the `changes | explorer | search` mode and renders `FilesChanges`, `FilesExplorer`, or `FilesSearch`, so one co-located story file can exercise the related File components without editing production code.
- `apps/web-app/src/hooks/queries/useFiles.ts:11-95` shows all server state used by this surface. Mock the opencode SDK requests with per-story MSW handlers for `GET */oc/vcs/diff`, `GET */oc/file`, `GET */oc/file/content`, and `GET */oc/find/file`; the SDK endpoint definitions confirm these paths, and handlers should inspect the `path` or `query` search parameter where different fixture responses are needed.
- Use realistic typed fixture shapes: a file-list row needs `name`, `path`, `absolute`, `type`, and `ignored`; file content needs `type` and `content`; a VCS diff needs `file`, `additions`, `deletions`, optional `status`, and optional unified `patch`. Include at least one directory with children, multiple file extensions, all three VCS statuses, one diff without a patch, and text content suitable for asserting the preview.
- `apps/web-app/.storybook/preview.tsx:1-26` already initializes MSW globally, but it does not install a TanStack Query provider. Wrap each story in a fresh `QueryClientProvider` with query and mutation retries disabled; create a new client per mounted story so cached results cannot leak between populated, empty, and error stories.
- Follow the authoring pattern in `apps/web-app/src/components/chat/SessionStatusBar.stories.tsx:90-114` for the Query provider and MSW parameters, but import the preview through `@/storybook/preview` as preferred by the frontend guide. Follow `apps/web-app/src/components/file-update-viewer/index.stories.tsx:127-183` for a fixed-height bordered frame that gives the full-height File UI a stable canvas.
- Set the story title to `Files/FilesContainer`, add `tags: ["autodocs"]`, use `parameters: { layout: "fullscreen" }`, and render inside a roughly 800x600 frame. For compact behavior, use a narrow wrapper (about 360px) so the existing `@container` / `@files` rules in `FilesContainer.tsx:37` and the child views activate without adding a viewport addon.
- Add play functions to the populated interaction stories using the Storybook-provided `canvas`, `userEvent`, and `expect`. Account for the 300 ms debounce in `FileSearchInput.tsx:15-18`, and assert observable accessible text/roles rather than CSS implementation details.

## Tasks

- [x] 1. **Create the story harness, typed demo fixtures, an isolated QueryClient wrapper, and reusable success/error MSW handler factories.**
  - verify: `pnpm --filter web-app check-types`
  - files: `apps/web-app/src/components/files/FilesContainer.stories.tsx`
- [x] 2. **Add populated Changes stories covering all-files rendering and the single-file selection flow, including a play assertion for selecting a changed file.**
  - verify: `pnpm --filter web-app exec vitest --project storybook run`
  - files: `apps/web-app/src/components/files/FilesContainer.stories.tsx`
- [x] 3. **Add Explorer and Search interaction stories that navigate from the default tab, expand/select a nested file or debounce a search, and assert the mocked text preview.**
  - verify: `pnpm --filter web-app exec vitest --project storybook run`
  - files: `apps/web-app/src/components/files/FilesContainer.stories.tsx`
- [x] 4. **Add EmptyWorkspace, BackendError, and CompactViewport stories to expose no-data, retryable failure, and responsive sidebar-sheet states.**
  - verify: `pnpm --filter web-app build-storybook`
  - files: `apps/web-app/src/components/files/FilesContainer.stories.tsx`
- [x] 5. **Run the frontend quality gates and visually inspect every new story in both light and dark themes.**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest --project storybook run`
  - files: `apps/web-app/src/components/files/FilesContainer.stories.tsx`

## Done when

- [x] Storybook lists `Files/FilesContainer` with populated Changes, Explorer, Search, empty, error, and compact examples, all running without a live backend.
- [x] The play functions prove changed-file selection, nested Explorer selection, and debounced Search selection reach the expected detail or preview content.
- [x] `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest --project storybook run` exits successfully.
- [x] `pnpm --filter web-app build-storybook` completes successfully, and manual review finds no overflow or unreadable layout in the full and compact frames in light and dark themes.

## Notes for implementer

- Keep the change to the single story file. If the stories reveal a production bug, record it separately instead of silently expanding this plan.
- Do not add comments unless they are necessary, and use type-only imports for SDK fixture types.
- Keep MSW handlers local to this story module and deterministic; do not depend on the developer's filesystem, opencode instance, or network.
- Update both `## Tasks` and `## Done when` checkboxes in this plan as the work is completed, as required by the repository workflow.
