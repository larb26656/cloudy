---
title: "Notifications frontend: subscribe + bell UI"
slug: notifications-frontend-subscribe-bell-ui
id: 20260821-notifications-frontend-subscribe-bell-ui
status: ready
created: 2026-08-21
source: planning session 2026-08-21
---

# Plan: Notifications frontend: subscribe + bell UI

## Why

The backend notification feature (REST + WebSocket) is built by plan
`20260821-notifications-backend-sqlite-websocket.md`. Nothing in the web-app consumes it
yet: opencode events worth surfacing ("session finished", "permission asked", "question
asked") are lost when the user is in another tab, and there is no UI to review them. This
plan wires the web-app to the cloudy notifications API: persist notable opencode events
as notifications, subscribe to the WS stream, and show a bell + list in the app chrome.

**Prerequisite:** the backend plan is fully implemented and smoke-tested (its Done-when
list passes).

## Target file

| Path                                                                        | Action                        |
| --------------------------------------------------------------------------- | ----------------------------- |
| `packages/contracts/src/index.ts`                                           | edit (type re-exports)        |
| `apps/web-app/src/lib/cloudy/query-keys.ts`                                 | edit (add `notificationKeys`) |
| `apps/web-app/src/hooks/queries/useNotifications.ts`                        | create                        |
| `apps/web-app/src/lib/opencode/handle-global-event.ts`                      | edit (3 new cases)            |
| `apps/web-app/src/hooks/useNotificationsStream.ts`                          | create (WS → query cache)     |
| `apps/web-app/src/components/notification/*`                                | create (bell + dropdown)      |
| `apps/web-app/src/features/app/AppNav.tsx` (or wherever the chrome puts it) | edit                          |
| `apps/web-app/src/lib/opencode/handle-global-event.test.ts`                 | edit (new cases)              |
| `apps/web-app/src/hooks/useNotificationsStream.test.ts`                     | create                        |

## Context the new session needs

- **Read `apps/web-app/AGENTS.md` first** — data layer, stores, and "Global SSE event
  stream" sections especially. Also `apps/web-app/DESIGN.md` before writing UI.
- **cloudyClient**: `apps/web-app/src/lib/api.ts` — `hc<AppType>` singleton with
  `credentials: "include"`. Use it for all notification REST calls. `AppType` import from
  `@repo/contracts` is **type-only — never a runtime import**.
- **Contracts**: `packages/contracts/src/index.ts` re-exports `@repo/server` types for the
  browser. Add the notification types there (e.g. `NotificationDto`,
  `CreateNotificationInput`) — follow the existing re-export style in that file. The
  backend route returns DTOs whose TS types come from
  `packages/server/src/features/notifications/notifications.model.ts`.
- **Event → notification mapping** (the product decision): add these cases to
  `handleEvent` in `apps/web-app/src/lib/opencode/handle-global-event.ts` (switch starts
  at line 34; remember to add names to `KNOWN_EVENT_TYPES` at line 16):

  | opencode event     | type      | title                  | metadata                                       |
  | ------------------ | --------- | ---------------------- | ---------------------------------------------- |
  | `question.asked`   | `info`    | "Question asked"       | `{ source: "opencode", sessionID, directory }` |
  | `permission.asked` | `warning` | "Permission requested" | `{ source: "opencode", sessionID, directory }` |
  | `session.idle`     | `success` | "Session completed"    | `{ source: "opencode", sessionID, directory }` |

  Fire-and-forget `cloudyClient.api.notifications.$post({ json: {...} })` — do not await
  inside the event handler beyond error-logging to `console.debug`. **Gotcha**:
  `question.asked` / `permission.asked` are legacy names not present in the current
  `@opencode-ai/sdk` Event union (it has `permission.updated` / `permission.replied`) —
  the existing code already listens for the legacy names, so keep them, but verify at
  runtime which actually arrives against the real instance (check the Network/WS frames);
  add `permission.updated` as an additional case if that's what fires.

- **`session.idle` dedupe**: only notify for sessions the user actually cares about is
  _not_ attempted in v1 — every idle event POSTs. The backend caps history at 30, so noise
  self-prunes. `sessionID` comes from `event.payload.properties.sessionID`; `directory`
  from `event.directory` (may be undefined — omit the key then).
- **Query keys**: cloudy-backed keys live in `apps/web-app/src/lib/cloudy/query-keys.ts`
  (`ptyKeys`, `workspaceKeys` are the pattern). Add `notificationKeys = { all: ["notifications"] }`
  style factory. **All server state through TanStack Query — never mirror into Zustand.**
- **WS hook**: backend endpoint is `GET /api/notifications/ws` on the cloudy API origin.
  Derive the URL from `env.getApiUrl()` (`apps/web-app/src/config/env.ts`) by swapping
  `http:`→`ws:` / `https:`→`wss:`. Dev runs web-app on 3001 and API on 4122 —
  `env.getApiUrl()` already handles that; WS is not CORS-constrained. Frames (JSON):
  `{ type: "snapshot", notifications }` → `queryClient.setQueryData(notificationKeys.all, ...)`;
  `{ type: "notification.created", notification }` → prepend (dedupe by id — the POST
  response and the WS broadcast can both arrive);
  `{ type: "notification.deleted", id }` → filter out;
  `{ type: "notifications.cleared" }` → `[]`.
  Reconnect: simple exponential backoff + resubscribe (snapshot frame resyncs state);
  optionally reuse the focus-reconnect idea from `GlobalEventProvider.tsx:46-51`. Mount
  the hook once from the provider layer (`main.tsx` chain) or inside the bell component —
  one subscription for the whole app.
- **UI**: bell icon + dropdown in the app chrome (`apps/web-app/src/features/app/AppNav.tsx`
  — inspect it first and place per existing layout; a Popover from `src/components/ui/`
  is the natural shell). List = newest first, icon/color by `type`
  (info/success/warning/error — use design tokens, not raw colors). Per-item delete +
  "Clear all" action (mutations via `useMutation` → REST DELETE). Empty state must use
  `EmptyState` from `@/components/ui/empty-state` (`size="compact"`), loading/error via
  `LoadingState`/`ErrorState` — never hand-rolled state JSX. Icons: `lucide-react` only
  (`Bell`, `CheckCheck`-style), with the `data-icon` sizing convention.
- **Testing matrix**: pure logic (`*.test.ts`, node project) for the handleEvent cases
  and the WS frame reducer; component tests (`*.component.test.tsx`, jsdom) if the bell
  dropdown warrants it. Existing `handle-global-event.test.ts` shows the fake-event
  builder pattern (line 73-77).

## Tasks

- [x] 1. **Re-export notification types from `@repo/contracts`**
  - do: add type re-exports (`NotificationDto`, `CreateNotificationInput`) following the
    file's existing style
  - verify: `pnpm --filter web-app check-types` passes and
    `grep -n "Notification" packages/contracts/src/index.ts` shows the re-exports
  - files: `packages/contracts/src/index.ts`
- [x] 2. **Add `notificationKeys` + query/mutation hooks**
  - do: `notificationKeys` in query-keys.ts; `useNotifications.ts` with
    `useNotifications` (GET), `useCreateNotification`, `useDeleteNotification`,
    `useClearNotifications` (mutations invalidating `notificationKeys.all`) — copy the
    shape of the workspace hooks in `apps/web-app/src/hooks/queries/`
  - verify: `pnpm --filter web-app check-types` passes
  - files: `apps/web-app/src/lib/cloudy/query-keys.ts`, `apps/web-app/src/hooks/queries/useNotifications.ts`
- [x] 3. **Map the 3 opencode events to notification POSTs**
  - do: extend `KNOWN_EVENT_TYPES` + switch in `handle-global-event.ts` per the mapping
    table above; verify against a live instance which permission event actually fires and
    handle it
  - verify: `pnpm --filter web-app exec vitest run src/lib/opencode/handle-global-event.test.ts` green with new cases
  - files: `apps/web-app/src/lib/opencode/handle-global-event.ts`, `...test.ts`
- [x] 4. **WS subscription hook keeping the query cache in sync**
  - do: `useNotificationsStream()` per Context (backoff reconnect, frame handling, dedupe
    by id); unit-test the pure frame-reducer function
  - verify: `pnpm --filter web-app exec vitest run src/hooks/useNotificationsStream.test.ts` green; with `pnpm run dev` + a second browser tab, POSTing via curl from terminal makes the open tab's cache update (bell list shows it without refresh)
  - files: `apps/web-app/src/hooks/useNotificationsStream.ts`, `...test.ts`
- [x] 5. **Bell + dropdown UI in the app chrome**
  - do: notification components under `src/components/notification/` (shared by chrome
    now, desk-node later); wire into `AppNav` (or the chrome's equivalent spot); use
    `EmptyState`/`ErrorState`/`LoadingState`, design tokens, `cn()`; per-item delete +
    clear-all
  - verify: `pnpm --filter web-app check-types && pnpm --filter web-app lint` pass; manual pass in dev shows bell, live-updating list, delete + clear all
  - files: `apps/web-app/src/components/notification/*`, `apps/web-app/src/features/app/AppNav.tsx`
- [x] 6. **Full gate**
  - do: run web-app checks
  - verify: `pnpm --filter web-app exec vitest run && pnpm --filter web-app lint && pnpm --filter web-app check-types` all green
  - files: —

## Done when

- [ ] Triggering a real opencode session to idle (or a permission/question) while the
      web-app is open creates a notification that appears in the bell dropdown without a
      page refresh
- [x] Two open tabs stay in sync (tab A sees tab B's clear-all within a second)
- [x] History survives a full page reload (GET snapshot repopulates)
- [x] `pnpm --filter web-app exec vitest run && pnpm --filter web-app lint && pnpm --filter web-app check-types` all green

## Notes for implementer

- Never add a runtime import from `@repo/contracts` (type-only).
- Zustand is not used for notifications — TanStack Query only.
- Don't "fix" the `CONNETED` typo or refactor `GlobalEventProvider` while in there.
- No comments unless asked; match existing hook/component style.
- If WS frames and REST responses race (duplicate created notification), dedupe by `id`
  in the cache updater — idempotent writes.
