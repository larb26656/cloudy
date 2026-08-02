---
title: Migrate workspaceStore to React Query (web-app)
slug: webapp-workspace-react-query
id: 20260802-webapp-workspace-react-query
status: implemented
created: 2026-08-02
source: planning session 2026-08-02
---

# Plan: Migrate workspaceStore to React Query (web-app)

## Why

Workspace data today lives only in the browser: a Zustand store persisted to
`localStorage` (`apps/web-app/src/stores/workspaceStore.ts`). The backend plan
(`docs/plan/20260802-backend-workspace-sqlite.md`) ships a real `/api/workspaces`
CRUD backed by SQLite. Once it lands, the frontend must talk to the server so data
survives browser wipes, syncs across devices, and backs future server features
(notifications, scheduled jobs). This plan replaces the Zustand store with React
Query hooks (matching the existing `usePty` / `useSessions` pattern), drops the dead
`instanceId` field, adds proper loading UI, and also removes the unused
`WorkspaceStrip` component. It depends on the backend plan being shipped first —
`AppType` must expose `.api.workspaces.*` before any task here can typecheck.

## Target file

| Path | Action |
| --- | --- |
| `apps/web-app/src/lib/cloudy/workspaces.ts` | create — relocate `WORKSPACE_COLORS`; re-export `Workspace` type from `@repo/contracts` |
| `apps/web-app/src/lib/cloudy/query-keys.ts` | edit — add `workspaceKeys` factory |
| `apps/web-app/src/hooks/queries/useWorkspaces.ts` | create — list/detail queries + create/update/delete mutations |
| `apps/web-app/src/hooks/queries/index.ts` | edit — re-export `useWorkspaces` hooks |
| `apps/web-app/src/stores/selectedWorkspaceStore.ts` | create — non-persist Zustand store, mirror `sessionStore.ts` pattern |
| `apps/web-app/src/stores/workspaceStore.ts` | delete — entire file |
| `apps/web-app/src/components/workspace/WorkspaceStrip.tsx` | delete — unused (only self-import in stories) |
| `apps/web-app/src/components/workspace/WorkspaceStrip.stories.tsx` | delete — companion story |
| `apps/web-app/src/main.tsx` | edit — one-shot `localStorage.removeItem("workspaces")` cleanup at boot |
| `apps/web-app/src/components/workspace/WorkspaceDot.tsx` | edit — `useWorkspace(id)` lookup |
| `apps/web-app/src/features/workspace/WorkspaceDialog.tsx` | edit — swap create/update/delete to mutations; drop `instanceId`; drop sync directory-uniqueness refine (server enforces) |
| `apps/web-app/src/features/workspace/WorkspaceSelectStep.tsx` | edit — `useWorkspaces()` + loading state |
| `apps/web-app/src/features/home/HomeContent.tsx` | edit — `useWorkspaces()` + selection store + `useDeleteWorkspace()`; loading state |
| `apps/web-app/src/features/chat/ChatPage.tsx` | edit — selection store + `useWorkspace(id)` |
| `apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx` | edit — `useWorkspace(tab.data.workspaceId)`; loading state |
| `apps/web-app/src/features/home/tabs/implementations/files/FilesContent.tsx` | edit — `useWorkspace(tab.data.workspaceId)` |
| `apps/web-app/src/features/home/tabs/implementations/terminal/TerminalTabItem.tsx` | edit — `useWorkspace(id)` for label |
| `apps/web-app/src/features/desk/nodes/implementations/chat-node/ChatNode.tsx` | edit — `useWorkspace(id)` |
| `apps/web-app/src/features/desk/nodes/implementations/terminal-node/TerminalNode.tsx` | edit — `useWorkspace(id)` |
| `apps/web-app/src/features/chat/components/CreateChatDialog.tsx` | edit — type-only import path |
| `apps/web-app/src/components/ui/WorkspaceItem.tsx` | edit — type-only import path |
| `apps/web-app/src/components/terminal/TerminalWorkspaceDialog.tsx` | edit — type-only import path |
| `apps/web-app/src/features/home/components/WorkspaceItem.tsx` | edit — type-only import path |
| `apps/web-app/src/components/ui/color-picker/ColorPicker.stories.tsx` | edit — `WORKSPACE_COLORS` import path |
| `apps/web-app/src/features/desk/nodes/implementations/WindowFrame.stories.tsx` | edit — `WORKSPACE_COLORS` import path; MSW handler for `GET /api/workspaces` |
| `apps/web-app/AGENTS.md` | edit — drop workspaceStore, document new hooks + selection store |

~24 files, but single logical change: migrate one feature from local store to RQ
plus prune one dead component. Splitting would break typecheck at every
intermediate step.

## Context the new session needs

- **BLOCKER:** the backend plan `docs/plan/20260802-backend-workspace-sqlite.md`
  must be shipped first. This plan imports `WorkspaceDto` from `@repo/contracts`
  (re-exported type-only from `@repo/server`'s `AppType`). Verify
  `packages/contracts/src/index.ts` exposes the workspace route in `AppType`
  before starting — `pnpm run check-types` against `@repo/contracts` should pass.
- **Repo conventions** (`apps/web-app/AGENTS.md`): TanStack Query for ALL server
  state; Zustand is for client-only state. Path alias `@/*` → `src/*`. ESM only;
  `import type` for type-only imports. No comments unless asked. Prettier default
  config.
- **React Query setup is global.** `apps/web-app/src/providers/QueryProvider.tsx:1-21`
  wraps the app at `main.tsx:25-38`. Defaults: `staleTime: 5_000`,
  `refetchOnWindowFocus: "always"`, `retry: 1`, mutation `retry: 0`. Module-scope
  `queryClient` export. New hooks auto-available everywhere — no boot edits beyond
  the one-shot cleanup in Task 11.
- **Template hook:** `apps/web-app/src/hooks/queries/usePty.ts:1-149` is the
  closest existing cloudy-client hook. Mirror its structure: import `cloudyClient`
  + a `*Keys` factory; export `useFoo()` / `useFoo(id)` / `useCreateFoo()` /
  `useUpdateFoo()` / `useDeleteFoo()`. Note `usePty.ts:95-108` prefetches detail
  cache from create response — do the same for workspaces.
- **`cloudyClient` definition:** `apps/web-app/src/lib/api.ts:9-13`. Singleton
  via `getClient()`. Type-only `AppType` import per `@repo/contracts` rule.
- **Query-key factory pattern:** `apps/web-app/src/lib/cloudy/query-keys.ts:1-15`
  — already has `ptyKeys`. Add `workspaceKeys = { root: () => ["workspaces"] as
  const, list: () => [...root(), "list"], detail: (id) => [...root(), "detail", id] }`.
  The file's own comment at `:7-9` says "add new feature factories here."
- **Selection-only Zustand template:** `apps/web-app/src/stores/sessionStore.ts`
  (non-persist, just `{ selectedSessionId, selectSession }`). Copy this shape for
  `selectedWorkspaceStore`.
- **Loading components exist already:** `apps/web-app/src/components/ui/loading-state.tsx`
  (full-page `<Loader2 className="size-5 animate-spin" />`) and
  `apps/web-app/src/components/ui/loading-spinner.tsx` (inline `size-4`). Pattern
  used in `ModelSelector.tsx:122`, `AgentSelector.tsx:90`, `SessionList.tsx:36`,
  `FilesContent.tsx:75` — branch on `isLoading` from the query, render the spinner.
  Do NOT invent new loading components.
- **Tab data carries `workspaceId` only** — never the full workspace object. Per
  tab-type meta: `chat/meta.ts:9`, `files/meta.ts:8`, `terminal/meta.ts:9`. After
  the wipe (Task 11) stale `workspaceId`s in localStorage tabs will reference IDs
  that no longer exist on the server; the existing `<ErrorState>` branches at
  `ChatContent.tsx:15-22`, `FilesContent.tsx:66-73`, `ChatNode.tsx:71-74`,
  `TerminalNode.tsx:86-90` already render a "Workspace not found / close this tab"
  message. **No tabStore version bump needed** — self-recover pattern handles it.
- **Workspace type alignment:** backend `WorkspaceDto` will be `{ id, name, color,
  directory, createdAt, updatedAt }`. Current frontend `Workspace` has `instanceId`
  (dead) and lacks `updatedAt`. The migration drops `instanceId` and gains
  `updatedAt` — type just becomes a re-export of `WorkspaceDto`.
- **`WORKSPACE_COLORS`** (`workspaceStore.ts:5-14`) is a `const [...] as const` of
  8 hex strings, used by `WorkspaceDialog` (color picker options) and 2 stories.
  Move to `src/lib/cloudy/workspaces.ts`. The `Workspace["color"]` type widens to
  `string` (backend stores any text) — keep the constant as the picker's option
  list, not a type constraint.
- **WorkspaceStrip is dead code.** Confirmed via
  `rg -n "WorkspaceStrip" apps/web-app/src`: only `WorkspaceStrip.tsx` itself and
  its own `.stories.tsx` reference it. No real importer. Safe to delete both.
  `WorkspaceDot.tsx` (the other file in `components/workspace/`) IS still used —
  keep it.
- **Stories use MSW for cloudy endpoints.** Check
  `apps/web-app/src/test/msw/` or existing story setup (e.g. `usePty` stories if
  any) for the handler pattern. Add `GET /api/workspaces` MSW handlers so stories
  that render `<WindowFrame>` show real data without hitting the server.
- **`SessionList` already takes `{ workspaceId, directory }` as props**
  (`apps/web-app/src/features/home/components/SessionList.tsx:11-15`) and already
  uses `useSessions` (RQ). No edit needed there — its callers (`HomeContent.tsx`)
  pass the props after resolving the workspace via the new hook.
- **Decisions already made (do not revisit):**
  - Loading UI: proper spinner/skeleton branches (NOT cache seeding).
  - Selection: new file `selectedWorkspaceStore.ts`, non-persist.
  - Constants home: `src/lib/cloudy/workspaces.ts`.
  - Drop `instanceId` everywhere in this plan.
  - Drop existing localStorage data (no migration of stale workspaces to server).
  - Delete `WorkspaceStrip.tsx` + its story (unused).

## Tasks

- [x] 1. **Verify backend plan shipped.**
   - verify: `rg -n "workspaces" packages/server/src/server.ts` matches; `pnpm --filter @repo/contracts check-types` clean; `WorkspaceDto` is exported from `@repo/contracts`.
   - files: `@repo/contracts/src/index.ts`, `@repo/server/src/index.ts`
- [x] 2. **Create `src/lib/cloudy/workspaces.ts` with relocated `WORKSPACE_COLORS` + `Workspace` type re-export.**
   - verify: `pnpm --filter web-app check-types` clean.
   - files: `apps/web-app/src/lib/cloudy/workspaces.ts`
- [x] 3. **Add `workspaceKeys` to `src/lib/cloudy/query-keys.ts`.**
   - verify: `rg -n "workspaceKeys" apps/web-app/src/lib/cloudy/query-keys.ts` shows root/list/detail factories.
   - files: `apps/web-app/src/lib/cloudy/query-keys.ts`
- [x] 4. **Create the hooks file `src/hooks/queries/useWorkspaces.ts` and re-export from `index.ts`.**
   - verify: `pnpm --filter web-app check-types` clean; `rg -n "useWorkspaces|useWorkspace|useCreateWorkspace|useUpdateWorkspace|useDeleteWorkspace" apps/web-app/src/hooks/queries/index.ts` shows all five exports.
   - files: `apps/web-app/src/hooks/queries/useWorkspaces.ts`, `apps/web-app/src/hooks/queries/index.ts`
- [x] 5. **Create `src/stores/selectedWorkspaceStore.ts` (non-persist, mirror `sessionStore.ts`).**
   - verify: `pnpm --filter web-app check-types` clean; store exposes `{ selectedWorkspaceId, selectWorkspace }`.
   - files: `apps/web-app/src/stores/selectedWorkspaceStore.ts`
- [x] 6. **Swap mutators: `WorkspaceDialog.tsx` (create/update/delete → mutations, drop `instanceId`, drop sync directory-uniqueness refine) and `HomeContent.tsx` (delete → mutation).**
   - verify: `pnpm --filter web-app check-types` clean; `rg -n "useWorkspaceStore" apps/web-app/src/features/workspace/WorkspaceDialog.tsx apps/web-app/src/features/home/HomeContent.tsx` returns no matches.
   - files: `apps/web-app/src/features/workspace/WorkspaceDialog.tsx`, `apps/web-app/src/features/home/HomeContent.tsx`
- [x] 7. **Swap list+selection readers: `HomeContent.tsx`, `WorkspaceSelectStep.tsx`, `ChatPage.tsx`. Each branches on `isLoading` from `useWorkspaces()` and renders `<LoadingState />` (or `<LoadingSpinner />` inline).**
   - verify: `pnpm --filter web-app check-types` clean; `rg -n "useWorkspaceStore" apps/web-app/src/features/workspace/WorkspaceSelectStep.tsx apps/web-app/src/features/chat/ChatPage.tsx` returns no matches.
   - files: `apps/web-app/src/features/home/HomeContent.tsx`, `apps/web-app/src/features/workspace/WorkspaceSelectStep.tsx`, `apps/web-app/src/features/chat/ChatPage.tsx`
- [x] 8. **Swap detail-by-id readers: `WorkspaceDot.tsx`, `ChatContent.tsx`, `FilesContent.tsx`, `TerminalTabItem.tsx`, `ChatNode.tsx`, `TerminalNode.tsx`. Use `useWorkspace(id)`; keep existing `<ErrorState>` branches for missing-workspace case (now driven by `!data` instead of `undefined` lookup).**
   - verify: `pnpm --filter web-app check-types` clean; `rg -n "useWorkspaceStore" apps/web-app/src` returns no matches in `.tsx`.
   - files: `apps/web-app/src/components/workspace/WorkspaceDot.tsx`, `apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx`, `apps/web-app/src/features/home/tabs/implementations/files/FilesContent.tsx`, `apps/web-app/src/features/home/tabs/implementations/terminal/TerminalTabItem.tsx`, `apps/web-app/src/features/desk/nodes/implementations/chat-node/ChatNode.tsx`, `apps/web-app/src/features/desk/nodes/implementations/terminal-node/TerminalNode.tsx`
- [x] 9. **Repoint type-only `Workspace` and `WORKSPACE_COLORS` imports across remaining files.**
   - verify: `pnpm --filter web-app check-types` clean; `rg -n "from \"@/stores/workspaceStore\"" apps/web-app/src` returns no matches.
   - files: `apps/web-app/src/features/chat/components/CreateChatDialog.tsx`, `apps/web-app/src/components/ui/WorkspaceItem.tsx`, `apps/web-app/src/components/terminal/TerminalWorkspaceDialog.tsx`, `apps/web-app/src/features/home/components/WorkspaceItem.tsx`, `apps/web-app/src/components/ui/color-picker/ColorPicker.stories.tsx`
- [x] 10. **Delete `src/stores/workspaceStore.ts`.**
   - verify: `ls apps/web-app/src/stores/workspaceStore.ts` errors "No such file"; `pnpm --filter web-app check-types` clean.
   - files: `apps/web-app/src/stores/workspaceStore.ts`
- [x] 11. **Delete `src/components/workspace/WorkspaceStrip.tsx` and `WorkspaceStrip.stories.tsx`.**
   - verify: `ls apps/web-app/src/components/workspace/WorkspaceStrip.tsx apps/web-app/src/components/workspace/WorkspaceStrip.stories.tsx` errors; `rg -n "WorkspaceStrip" apps/web-app/src` returns no matches.
   - files: `apps/web-app/src/components/workspace/WorkspaceStrip.tsx`, `apps/web-app/src/components/workspace/WorkspaceStrip.stories.tsx`
- [x] 12. **Add one-shot `localStorage.removeItem("workspaces")` at app boot.**
   - verify: `rg -n "removeItem.*workspaces" apps/web-app/src/main.tsx` matches.
   - files: `apps/web-app/src/main.tsx`
- [x] 13. **Update remaining stories: fix `WORKSPACE_COLORS` import path in `ColorPicker.stories.tsx`; add MSW handler for `GET /api/workspaces` in `WindowFrame.stories.tsx` so it renders real data.**
   - verify: `pnpm --filter web-app exec storybook build` succeeds.
   - files: `apps/web-app/src/components/ui/color-picker/ColorPicker.stories.tsx`, `apps/web-app/src/features/desk/nodes/implementations/WindowFrame.stories.tsx`
- [x] 14. **Update `apps/web-app/AGENTS.md` — drop the `workspaceStore` mention; document the new RQ hooks and `selectedWorkspaceStore`; remove `WorkspaceStrip` from any component map.**
   - verify: `rg -n "workspaceStore|WorkspaceStrip" apps/web-app/AGENTS.md` returns no matches; section on data layer mentions `useWorkspaces` + `selectedWorkspaceStore`.
   - files: `apps/web-app/AGENTS.md`
- [x] 15. **Full repo verify.**
   - verify: `pnpm run check-types && pnpm run lint && pnpm --filter web-app test && pnpm build` all green.
   - files: —

Tasks 2-5 are pure additions (no breakage). Tasks 6-9 swap consumers incrementally.
Tasks 10-11 delete the dead store + component. Task 12 is the localStorage cleanup.
Each task leaves the repo typechecking.

## Done when

- [x] `apps/web-app/src/stores/workspaceStore.ts` does not exist; nothing under
      `apps/web-app/src/` imports from `@/stores/workspaceStore`.
- [x] `apps/web-app/src/components/workspace/WorkspaceStrip.tsx` and
      `WorkspaceStrip.stories.tsx` do not exist; no references to `WorkspaceStrip`
      remain anywhere in `apps/web-app/src/`.
- [x] `Workspace`, `WORKSPACE_COLORS` come from `src/lib/cloudy/workspaces.ts`;
      `Workspace` is a re-export of `WorkspaceDto` from `@repo/contracts`.
- [x] `useWorkspaces()` (list), `useWorkspace(id)` (detail), `useCreateWorkspace()`,
      `useUpdateWorkspace()`, `useDeleteWorkspace()` exist and are re-exported from
      `src/hooks/queries/index.ts`.
- [x] All list consumers (`HomeContent`, `WorkspaceSelectStep`) branch on
      `isLoading` and render an existing loading component (`<LoadingState />` or
      `<LoadingSpinner />`).
- [x] `selectedWorkspaceStore.ts` exists, non-persist, exposes
      `{ selectedWorkspaceId, selectWorkspace }`.
- [x] `instanceId` field is gone from all TS types, forms, and props.
- [x] Opening the app once after deploy leaves no `workspaces` key in
      `localStorage` (one-shot cleanup ran).
- [ ] Manual smoke: create workspace → restart browser → workspace still listed;
      create tab in workspace → restart → tab still resolves workspace via server.
- [x] `pnpm run check-types && pnpm run lint && pnpm --filter web-app test && pnpm build`
      all green.

## Notes for implementer

- **Backend plan is a hard prerequisite.** Do not start until
  `docs/plan/20260802-backend-workspace-sqlite.md` is shipped and `WorkspaceDto`
  flows through `@repo/contracts`. Verify with
  `pnpm --filter @repo/contracts check-types` before Task 2.
- **No tabStore version bump.** Existing `<ErrorState>` self-recover pattern
  handles stale `workspaceId`s after the localStorage wipe. Documented in nested
  AGENTS.md.
- **Loading UI discipline:** branch on `isLoading` from the query — do NOT seed
  the detail cache from the list to mask the fetch gap. Decision was explicit:
  proper loading state, not cache tricks. If a consumer shows a flash, fix the UX
  with a spinner, not a workaround.
- **Backend errors flow through the mutation's `onError`** — surface them via
  `toast.error(...)` from `sonner` (already used elsewhere in the app). Do not
  throw from the mutation body. The server returns 409 for duplicate `directory`,
  404 for missing id on update/delete — translate to user-facing messages.
- **Drop `instanceId` aggressively.** Anywhere it appears (type field, form field,
  the `void instanceId` previously in `WorkspaceStrip.tsx`, the
  `instanceId: "default"` hardcoded in `WorkspaceDialog.tsx:140-145`) — remove.
  It is dead.
- **Do not add cascade-close on workspace delete.** Keep the current self-recover
  behavior (orphans render `<ErrorState>` with a "close this tab" affordance).
- **MSW handler for stories:** if a `apps/web-app/src/test/msw/handlers.ts` (or
  similar) exists, add a `http.get("/api/workspaces", ...)` resolver returning a
  static fixture. If no MSW setup exists yet, storybook loaders can seed
  `queryClient.setQueryData(workspaceKeys.list(), [...])` — pick whichever the
  existing `usePty`-consuming stories use.
- **WorkspaceStrip removal is safe.** Confirmed no real importer — only its own
  story references it. `WorkspaceDot.tsx` in the same folder IS still used; do
  not delete the folder.
- **Don't commit `.env*`, `dist/`, or `*.tgz`.** No commit unless explicitly asked.
