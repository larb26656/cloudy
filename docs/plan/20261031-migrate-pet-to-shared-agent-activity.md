---
title: Migrate Pet to shared agent activity
slug: migrate-pet-to-shared-agent-activity
id: 20261031-migrate-pet-to-shared-agent-activity
status: ready
created: 2026-10-31
source: planning session 2026-10-31
---

# Plan: Migrate Pet to shared agent activity

## Why

After the shared activity hook is extracted, the existing floating Pet and desktop overlay should consume that neutral hook rather than a Pet-owned hook. This keeps current Pet behavior intact while allowing the notification-area Cloudy control to use the same source of activity state.

## Target file

| Path                                                           | Action |
| -------------------------------------------------------------- | ------ |
| `apps/web-app/src/features/pet/FloatingPet.tsx`                | edit   |
| `apps/web-app/src/features/pet/PetOverlay.tsx`                 | edit   |
| `apps/web-app/src/hooks/usePetActivity.ts`                     | delete |
| `apps/web-app/src/hooks/usePetActivity.component.test.tsx`     | delete |
| `apps/web-app/src/features/pet/FloatingPet.component.test.tsx` | edit   |
| `apps/web-app/src/features/pet/PetOverlay.component.test.tsx`  | edit   |

## Context the new session needs

- **Prerequisite:** `20261031-extract-shared-agent-activity-hook.md` is implemented. Use the API defined by `apps/web-app/src/hooks/useAgentActivity.ts`; do not recreate activity fetching in either Pet component.
- `FloatingPet` (`apps/web-app/src/features/pet/FloatingPet.tsx:39-47`) renders only in browser mode and uses activity to set sprite state, accessible label, and its activity list. `PetOverlay` (`apps/web-app/src/features/pet/PetOverlay.tsx:31-39`) is the Electron `/pet` window consumer and also needs the same data.
- `PetSprite` defines the display-only `PetState` union (`apps/web-app/src/features/pet/PetSprite.tsx:3-10`). Map the generic activity state to this visual state in Pet-facing code; the shared hook must not import the sprite type.
- Activity row selection in `FloatingPet` opens/focuses a chat tab via `openSessionTab` and `useTabStore`; desktop overlay forwards the selected session through `petBridge`. Preserve both interaction paths.
- Existing integration behavior is covered by `FloatingPet.component.test.tsx` and `PetOverlay.component.test.tsx`. The old hook's focused behavior tests should move to the generic hook test created by the prerequisite plan, then its Pet-specific test file can be removed.

## Tasks

- [x] 1. **Switch browser FloatingPet and desktop PetOverlay to `useAgentActivity`, mapping generic activity state to sprite presentation locally.**
  - verify: `pnpm --filter web-app check-types`
  - files: `apps/web-app/src/features/pet/FloatingPet.tsx`, `apps/web-app/src/features/pet/PetOverlay.tsx`
- [x] 2. **Update Pet component tests to assert the shared hook drives the same activity states and preserves session-opening behavior.**
  - verify: `pnpm --filter web-app exec vitest run src/features/pet/FloatingPet.component.test.tsx src/features/pet/PetOverlay.component.test.tsx`
  - files: `apps/web-app/src/features/pet/FloatingPet.component.test.tsx`, `apps/web-app/src/features/pet/PetOverlay.component.test.tsx`
- [x] 3. **Remove the temporary Pet hook adapter and its superseded hook test after confirming no remaining imports.**
  - verify: `pnpm --filter web-app check-types` and `rg 'usePetActivity' apps/web-app/src` returns no matches
  - files: `apps/web-app/src/hooks/usePetActivity.ts`, `apps/web-app/src/hooks/usePetActivity.component.test.tsx`
- [x] 4. **Run focused quality checks for the migrated Pet consumers.**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run src/features/pet/FloatingPet.component.test.tsx src/features/pet/PetOverlay.component.test.tsx src/hooks/useAgentActivity.component.test.tsx`
  - files: `apps/web-app/src/features/pet/FloatingPet.tsx`, `apps/web-app/src/features/pet/PetOverlay.tsx`, `apps/web-app/src/features/pet/FloatingPet.component.test.tsx`, `apps/web-app/src/features/pet/PetOverlay.component.test.tsx`

## Done when

- [x] Both browser Pet and Electron overlay use the shared activity hook.
- [x] Pet state priority, sprite state mapping, session navigation, and desktop bridge behavior remain covered and passing.
- [x] No `usePetActivity` implementation or references remain.

## Notes for implementer

- Keep the Pet's visual mapping/labels in the Pet presentation layer, not in the generic hook.
- Preserve existing browser-vs-Electron rendering and bridge behavior.
