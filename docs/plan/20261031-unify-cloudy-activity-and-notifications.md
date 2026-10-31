---
title: Unify Cloudy activity and notifications
slug: unify-cloudy-activity-and-notifications
id: 20261031-unify-cloudy-activity-and-notifications
status: ready
created: 2026-10-31
source: planning session 2026-10-31
---

# Plan: Unify Cloudy activity and notifications

## Why

The app chrome currently exposes notifications through a bell popover, while current agent activity is presented separately by Pet UI. Replace the notification bell trigger with the Cloudy sprite and combine current activity with notification history in one popover, so users can see what Cloudy is doing and review past notifications from the same control.

## Target file

| Path                                                                           | Action                                                |
| ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `apps/web-app/src/components/notification/NotificationBell.tsx`                | edit                                                  |
| `apps/web-app/src/components/notification/NotificationBell.component.test.tsx` | create                                                |
| `apps/web-app/src/components/notification/NotificationList.tsx`                | edit if needed for section composition/scroll layout  |
| `apps/web-app/src/features/pet/PetActivityList.tsx`                            | edit or extract as a reusable activity-list component |
| `apps/web-app/src/components/notification/index.ts`                            | edit only if component exports change                 |

## Context the new session needs

- **Prerequisites:** implement `20261031-extract-shared-agent-activity-hook.md` and `20261031-migrate-pet-to-shared-agent-activity.md` first. Consume `useAgentActivity` directly from this notification-area UI.
- `NotificationBell` (`apps/web-app/src/components/notification/NotificationBell.tsx:18-68`) currently owns one controlled Popover, unread dot, Clear all action, and `NotificationList`. Preserve all notification actions and existing unread indicator behavior while replacing the Bell glyph with the Cloudy sprite.
- Existing notification history UI (`apps/web-app/src/components/notification/NotificationList.tsx:31-80`) handles loading, error, empty, and list states; retain this behavior. Put it in the lower section of the same popover, with the Clear all action in that section header.
- Existing activity list (`apps/web-app/src/features/pet/PetActivityList.tsx:11-17`) renders active session rows and expects workspace data plus an `onOpenSession` callback. Reuse/extract it without coupling the generic activity hook back to Pet. Selecting a session from the unified popover should open/focus its chat tab using the same `openSessionTab` and `useTabStore` behavior as `FloatingPet`.
- Required layout: exactly one Cloudy trigger and one popover; inside, an **Agent activity** section appears first and a **Notifications** section second, separated visually. Avoid two nested/separate popovers. Keep the entire content usable with a bounded, scrollable panel.
- `PetSprite` (`apps/web-app/src/features/pet/PetSprite.tsx`) already animates idle/working/wait-for-human sprite rows. Map the generic activity state to this presentation state in the trigger. Preserve an accessible trigger label that reports waiting/working counts; keep the notification unread dot visible when notifications exist.
- The notification bell is consumed by both `DesktopTabBar` and `MobileTabBar`; keep the component responsive and do not relocate it. Before visual work, follow `apps/web-app/AGENTS.md` and `apps/web-app/DESIGN.md`; use existing shared Popover, EmptyState, ErrorState, and LoadingState primitives.

## Tasks

- [x] 1. **Compose one Cloudy-triggered popover with Agent activity above Notifications and preserve the notification section's Clear all action.**
  - verify: `pnpm --filter web-app check-types`
  - files: `apps/web-app/src/components/notification/NotificationBell.tsx`, `apps/web-app/src/components/notification/NotificationList.tsx`
- [x] 2. **Render the sprite from shared activity state, preserve unread indication/accessibility, and open the selected session in its chat tab.**
  - verify: `pnpm --filter web-app check-types`
  - files: `apps/web-app/src/components/notification/NotificationBell.tsx`, `apps/web-app/src/features/pet/PetActivityList.tsx`
- [x] 3. **Add component coverage for combined sections, idle/working/waiting sprite state, unread dot, Clear all, and session opening.**
  - verify: `pnpm --filter web-app exec vitest run src/components/notification/NotificationBell.component.test.tsx`
  - files: `apps/web-app/src/components/notification/NotificationBell.component.test.tsx`
- [x] 4. **Run frontend checks and verify both desktop and mobile app chrome render the same unified control.**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run src/components/notification/NotificationBell.component.test.tsx src/features/pet/FloatingPet.component.test.tsx src/features/pet/PetOverlay.component.test.tsx src/hooks/useAgentActivity.component.test.tsx`
  - files: `apps/web-app/src/components/notification/NotificationBell.tsx`, `apps/web-app/src/components/notification/NotificationBell.component.test.tsx`, `apps/web-app/src/features/pet/PetActivityList.tsx`

## Done when

- [x] The app chrome shows the Cloudy sprite instead of the bell, with activity-driven sprite state and the existing notification unread dot.
- [x] One click opens one popover containing Agent activity first and Notifications second; both sections retain their existing empty/loading/error and notification-management behavior.
- [x] Selecting an activity row opens or focuses the corresponding chat tab.
- [x] Component tests, lint, and typecheck pass; the same control is present in desktop and mobile tab bars.

## Notes for implementer

- The existing floating Pet is a separate browser widget; this plan replaces the notification control's trigger and combines its popover content. Do not remove or relocate the floating widget unless product scope is explicitly expanded.
- Follow the frontend rule to use individual Zustand selectors and TanStack Query for server state; do not mirror activity or notifications into a new store.
- No need to edit `DesktopTabBar` or `MobileTabBar` unless actual integration requires it; both already render `NotificationBell`.
