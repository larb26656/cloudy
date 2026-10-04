---
title: Add floating pet session indicator
slug: add-floating-pet-session-indicator
id: 20261004-add-floating-pet-session-indicator
status: complete
created: 2026-10-04
source: planning session 2026-10-04
---

# Plan: Add floating pet session indicator

## Why

Cloudy needs an app-wide, glanceable indicator for agent activity without requiring the user to visit a particular chat tab. A floating pet will summarize sessions that are working or blocked on the user, open or focus the selected session tab, and remain dismissible without leaving the user unable to restore it.

## Target file

| Path                                                             | Action |
| ---------------------------------------------------------------- | ------ |
| `apps/web-app/src/components/pet/FloatingPet.tsx`                | create |
| `apps/web-app/src/components/pet/FloatingPet.component.test.tsx` | create |
| `apps/web-app/public/sprite/cloudy-pet/`                         | create |
| `apps/web-app/src/routes/__root.tsx`                             | edit   |
| `apps/web-app/src/types/opencode.ts`                             | edit   |
| `apps/web-app/src/hooks/queries/useSessions.ts`                  | edit   |
| `apps/web-app/src/lib/opencode/handle-global-event.ts`           | edit   |
| `apps/web-app/src/lib/opencode/handle-global-event.test.ts`      | edit   |

## Context the new session needs

- This is intentionally a broader-than-normal handoff plan because the UI needs activity data, SSE refresh behavior, app-shell mounting, and focused tests. Keep the change limited to the listed frontend files; no backend endpoint or persistent store is necessary.
- `apps/web-app/src/routes/__root.tsx:6-11` is the stable router-wide shell. Render the pet alongside `Outlet` so it remains available on Home and Settings; use a fixed corner layer that does not intercept page interaction outside its own controls.
- The server already returns persisted `status` and `runStatus` in every `ChatSession` (`packages/ai-core/src/session.ts:26-45`). `apps/web-app/src/hooks/queries/useSessions.ts:11-22` currently discards both while mapping to `ChatSession`; retain them in the web type instead of adding a redundant server request per session.
- Activity states are defined as: `wait-for-human` when a session has a pending question or permission; otherwise `working` when `runStatus === "running"`; otherwise `idle`. The pet itself uses priority `wait-for-human` > `working` > `idle`. Its popover lists only the first two states; the idle panel states that no session needs attention.
- Pending questions are scoped by session through `useSessionQuestions()` (`apps/web-app/src/hooks/queries/useQuestions.ts:23-35`). Pending permissions are scoped by directory through `usePermissions()` (`apps/web-app/src/hooks/queries/usePermissions.ts:23-35`) and identify their owner with `sessionID` (`apps/web-app/src/types/opencode.ts:49-56`). Query them only for active sessions/directories.
- `apps/web-app/src/features/home/components/RecentSessionsSection.tsx:20-39` is the canonical conversion from a recent session to `chat` or `bot-chat` data. Reuse that behavior in the pet, including workspace lookup. `useTabStore((s) => s.openTab)` deduplicates by `(type, sessionId)` and focuses an existing tab (`apps/web-app/src/stores/tabStore.ts:84-102`).
- SSE status changes update the database in `packages/server/src/features/sessions/sessions.service.ts:273-280`, but `handleEvent` only invalidates the directory-specific session query after completion (`apps/web-app/src/lib/opencode/handle-global-event.ts:55-86`). Invalidate `sessionKeys.root()` on every `session.status` event so `useRecentSessions()` reflects starts, completions, and status changes.
- Pet visibility is intentionally local to the current page load: it starts visible, its dismiss button hides it, and a compact fixed restore button remains visible until clicked. Do not create a persisted Zustand store or a settings option for this first version. The controlled popover must also close through its close button, Escape, and click-outside behavior from the shared Popover primitive.
- Preserve the existing neutral, border-first visual system in `apps/web-app/DESIGN.md:180-196`. Animate the provided 8-bit sprite sheet continuously by state row, preserve pixelated rendering, and use shared loading/error/empty state components inside the popover.

## Tasks

- [x] 1. **Expose persisted session status fields in the web session model and recent-session query mapping.**
  - verify: `pnpm --filter web-app check-types`
  - files: `apps/web-app/src/types/opencode.ts`, `apps/web-app/src/hooks/queries/useSessions.ts`

- [x] 2. **Refresh the root session query whenever an SSE session-status event arrives, and cover the new invalidation behavior.**
  - verify: `pnpm --filter web-app exec vitest run src/lib/opencode/handle-global-event.test.ts`
  - files: `apps/web-app/src/lib/opencode/handle-global-event.ts`, `apps/web-app/src/lib/opencode/handle-global-event.test.ts`

- [x] 3. **Create the floating pet component that derives active-session records and the priority pet state from recent sessions, pending questions, and pending permissions.**
  - verify: `pnpm --filter web-app check-types`
  - files: `apps/web-app/src/components/pet/FloatingPet.tsx`

- [x] 4. **Implement the pet interaction surface: an accessible animated trigger, a controlled session-summary popover, session rows that call `openTab`, and visibility controls.**
  - The close button in the popover closes only the summary; a distinct dismiss button hides the pet widget; the persistent compact restore control returns the full pet.
  - verify: `pnpm --filter web-app exec vitest run src/components/pet/FloatingPet.component.test.tsx`
  - files: `apps/web-app/src/components/pet/FloatingPet.tsx`, `apps/web-app/src/components/pet/FloatingPet.component.test.tsx`

- [x] 5. **Mount the pet at the root route and test its state priority, open/focus action, popover close, widget dismiss, and restore action.**
  - verify: `pnpm --filter web-app exec vitest run src/components/pet/FloatingPet.component.test.tsx`
  - files: `apps/web-app/src/routes/__root.tsx`, `apps/web-app/src/components/pet/FloatingPet.component.test.tsx`

- [x] 6. **Run the targeted frontend quality checks and inspect the fixed control at desktop and mobile widths.**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run src/components/pet/FloatingPet.component.test.tsx src/lib/opencode/handle-global-event.test.ts`
  - files: `apps/web-app/src/components/pet/FloatingPet.tsx`, `apps/web-app/src/routes/__root.tsx`

## Done when

- [x] The pet accurately presents `idle`, `working`, and `wait-for-human`, with a pending question or permission taking precedence over running state.
- [x] The summary shows only active sessions, and selecting one creates its correct chat type or focuses its existing tab.
- [x] The summary popover closes through normal Popover behavior; dismissing the pet hides it; the fixed restore control makes it visible again without a reload.
- [x] `pnpm --filter web-app lint`, `pnpm --filter web-app check-types`, and the focused component/event tests pass.

## Notes for implementer

- Use TanStack Query for all activity data; do not mirror server session state in Zustand. Use individual Zustand selectors for `openTab`.
- Avoid new CSS tokens. Use the supplied sprite assets, existing semantic Tailwind tokens, and Lucide icons.
- Do not edit `src/routeTree.gen.ts`; it is generated.
