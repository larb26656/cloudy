---
title: "Notifications backend: SQLite + REST + WebSocket"
slug: notifications-backend-sqlite-websocket
id: 20260821-notifications-backend-sqlite-websocket
status: done
created: 2026-08-21
source: planning session 2026-08-21
---

# Plan: Notifications backend: SQLite + REST + WebSocket

## Why

Cloudy has no notification system: events like "session finished", "permission asked",
"question asked" happen while the user is in another tab and are lost. We want a
single-user notification feed persisted in SQLite (capped at the 30 most recent) that any
client can read/write over REST and subscribe to over WebSocket for realtime updates.
This phase is backend-only (`@repo/server`); the web-app consumption is a separate plan
(`20260821-notifications-frontend-webapp.md`).

## Design decisions (already made — do not relitigate)

- **No read/unread state.** Notifications are a plain history log, newest first.
- **Cap 30 rows** (single user, history beyond 30 is noise). Prune opportunistically on
  every create — no cron.
- **Server-generated id** (`randomUUID()` from `node:crypto` — no new deps).
- **metadata is a loose `Record<string, string>`** stored as JSON text. The frontend will
  write `{ source: "opencode", sessionID?, directory? }`; the backend stays generic.
- **WS is server-push only.** Clients do CRUD over REST; WS exists to (a) hand new
  subscribers a snapshot and (b) sync changes across tabs in realtime.
- **Architecture option A**: the web-app translates opencode events → `POST
/api/notifications`. The API is source-agnostic; a later server-side SSE subscriber can
  write through the same service without API changes.

## Target file

| Path                                                                              | Action                                |
| --------------------------------------------------------------------------------- | ------------------------------------- |
| `packages/server/src/db/schema/notifications.ts`                                  | create                                |
| `packages/server/src/db/schema/index.ts`                                          | edit (add export)                     |
| `packages/server/drizzle/<generated>.sql`                                         | create (via `db:generate`, commit it) |
| `packages/server/src/features/notifications/notifications.model.ts`               | create                                |
| `packages/server/src/features/notifications/notifications.repository.ts`          | create                                |
| `packages/server/src/features/notifications/notifications.errors.ts`              | create                                |
| `packages/server/src/features/notifications/notifications.service.ts`             | create                                |
| `packages/server/src/features/notifications/notifications.service.test.ts`        | create                                |
| `packages/server/src/features/notifications/notifications.controller.ts`          | create                                |
| `packages/server/src/features/notifications/notifications.integration.test.ts`    | create                                |
| `packages/server/src/features/notifications/notifications.ws-adapter.ts`          | create                                |
| `packages/server/src/features/notifications/notifications.ws.integration.test.ts` | create                                |
| `packages/server/src/features/notifications/index.ts`                             | create (barrel)                       |
| `packages/server/src/container.ts`                                                | edit                                  |
| `packages/server/src/server.ts`                                                   | edit                                  |

## API contract

REST (mounted at `/api/notifications`):

| Method | Path   | Request body              | Response                                                        |
| ------ | ------ | ------------------------- | --------------------------------------------------------------- |
| GET    | `/`    | —                         | `200 NotificationDto[]` (all rows, newest first; ≤30 by design) |
| POST   | `/`    | `CreateNotificationInput` | `201 NotificationDto`                                           |
| DELETE | `/:id` | —                         | `204`, `404` if unknown id                                      |
| DELETE | `/`    | —                         | `204` (clear all)                                               |

`NotificationDto`:

```ts
{
  id: string; // uuid, server-generated
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  metadata: Record<string, string> | null;
  createdAt: Date; // z.coerce.date(), same as WorkspaceDto
}
```

`CreateNotificationInput` = `{ type, title, message, metadata? }` (Zod, `zod` v4).

WebSocket (`GET /api/notifications/ws`, server-push only, JSON text frames):

```
on connect:  → { "type": "snapshot", "notifications": NotificationDto[] }
on create:   → { "type": "notification.created", "notification": NotificationDto }
on delete:   → { "type": "notification.deleted", "id": string }
on prune:    → { "type": "notification.deleted", "id": string }   // per pruned row
on clear:    → { "type": "notifications.cleared" }
```

## Context the new session needs

- **Feature conventions**: read `packages/server/AGENTS.md` first. Every feature is
  `model.ts` (Zod) → `repository.ts` (Drizzle only, plain `Error`, `null` for miss) →
  `service.ts` (factory fn, domain errors) → controller (catches domain errors →
  `HTTPException`). **Copy the workspaces feature as the reference implementation**:
  `packages/server/src/features/workspaces/` (model at
  `workspaces.model.ts:1-32`, repository at `workspaces.repository.ts:32-76`, service at
  `workspaces.service.ts:14-50`, errors at `workspaces.errors.ts:1-15`).
- **Schema pattern**: `packages/server/src/db/schema/workspaces.ts:9-20` — `sqliteTable`,
  text ids, `integer("created_at", { mode: "timestamp" }).default(sql\`(unixepoch())\`)`.
For `notifications`: `id`text PK,`type`text notNull,`title`text notNull,`message`text notNull,`metadata` `text("metadata", { mode: "json" })`nullable,`createdAt`same pattern as workspaces. Export`NotificationRecord`/`NewNotification`types and
re-export from`src/db/schema/index.ts`.
- **Prune query gotcha**: `unixepoch()` has _second_ resolution, so bursts of creates tie
  on `created_at`. The prune ORDER BY must be `created_at DESC, rowid DESC` (rowid is
  SQLite insert order — reliable tiebreaker). Same ORDER BY for the `list()` newest-first
  ordering. Raw SQL via drizzle `db.run(sql\`...\`)` is fine for the prune DELETE
(`DELETE FROM notifications WHERE id NOT IN (SELECT id FROM notifications ORDER BY
  created_at DESC, rowid DESC LIMIT 30)`); have `pruneToLimit(limit)`return the deleted
ids (query them before deleting) so the service can emit`notification.deleted` per
  pruned row.
- **Service event emitter pattern**: mirror `PtyService.onData/onExit` — listeners stored
  in a `Set`, `onCreated(cb)`, `onDeleted(cb)`, `onCleared(cb)` each return an unsubscribe
  function. See `packages/server/src/features/pty/pty.service.ts` for the idiom.
- **WS infra already exists — zero server plumbing needed**:
  - `packages/server/src/server/createServer.ts:23-30` already creates
    `new WebSocketServer({ noServer: true })` and passes it to `serve()`.
  - `packages/server/src/server.ts:49-53` already bypasses CORS for websocket upgrades.
  - Route wiring pattern: `upgradeWebSocket` from `@hono/node-server` — see
    `packages/server/src/features/pty/pty.controller.ts:84-91` (note it parses params
    itself inside the callback because zValidator doesn't run on upgrade requests).
  - Per-connection subscribe/unsubscribe adapter pattern:
    `packages/server/src/features/pty/pty.ws-adapter.ts` (offXxxx cleanup on
    close + error).
- **Controller conventions**: `hono-openapi` `describeRoute(...)` + `zValidator` from
  `@hono/zod-validator` on every REST route (see
  `workspaces.controller.ts` / `pty.controller.ts`). Route factory name:
  `createNotificationsController(service)`.
- **Wiring**: `packages/server/src/container.ts:9-24` — construct repository (takes
  `DbClient`), then service, add both to the returned object. Then
  `packages/server/src/server.ts:56-58` — add
  `.route("/api/notifications", createNotificationsController(container.notificationsService))`.
- **Zod v4**: `z.record` requires two args — `z.record(z.string(), z.string())`.
- **Type-only imports**: `import type { Foo }` for types-only (`verbatimModuleSyntax`).
- **No comments** unless JSDoc on exported APIs.

## Tasks

- [x] 1. **Create `notifications` Drizzle schema and generate the migration**
  - do: create `src/db/schema/notifications.ts` (fields per Context), export from
    `src/db/schema/index.ts`, run `pnpm --filter @repo/server db:generate`
  - verify: `ls packages/server/drizzle | tail -1` shows a new migration file; a new file
    `packages/server/src/db/schema/notifications.ts` exists containing `sqliteTable("notifications"`
  - files: `packages/server/src/db/schema/notifications.ts`, `packages/server/src/db/schema/index.ts`, `packages/server/drizzle/*`
- [x] 2. **Write `notifications.model.ts` (Zod schemas + derived types)**
  - do: `createNotificationSchema` (type enum `["info","success","warning","error"]`,
    `title: z.string().min(1)`, `message: z.string()`, `metadata:
z.record(z.string(), z.string()).nullable().optional()`), `notificationDtoSchema`
    (`z.coerce.date()` for createdAt), export `NotificationsModel` const bag + inferred types
  - verify: `pnpm --filter @repo/server check-types` passes with the new file
  - files: `packages/server/src/features/notifications/notifications.model.ts`
- [x] 3. **Write `notifications.repository.ts` (Drizzle, incl. pruneToLimit)**
  - do: interface + factory following `workspaces.repository.ts`; methods `list()`
    (newest first: `created_at DESC, rowid DESC`), `findById`, `create`, `delete`,
    `deleteAll`, `pruneToLimit(limit): string[]` (returns deleted ids; raw SQL ok)
  - verify: `pnpm --filter @repo/server check-types` passes
  - files: `packages/server/src/features/notifications/notifications.repository.ts`
- [x] 4. **Write service with listeners + unit tests**
  - do: `createNotificationsService(repo)` with `NOTIFICATION_LIMIT = 30`; `create` =
    insert (uuid via `randomUUID()`) → emit `onCreated` → `pruneToLimit(30)` → emit
    `onDeleted` per pruned id; `remove` throws `NotificationNotFoundError` on miss → emit
    `onDeleted`; `clear` → `deleteAll` → emit `onCleared`; `onCreated/onDeleted/onCleared`
    return unsubscribe fns. Unit test with `vitest-mock-extended` `mock<Repository>()`:
    create emits + prunes; remove 404s on miss (`rejects.toMatchObject({ status: 404 })`);
    unsubscribe stops delivery
  - verify: `pnpm --filter @repo/server exec vitest run src/features/notifications/notifications.service.test.ts` green
  - files: `notifications.service.ts`, `notifications.errors.ts`, `notifications.service.test.ts`
- [x] 5. **Write REST controller, wire container + server, integration test**
  - do: `createNotificationsController(service)` with the 4 REST routes
    (`describeRoute` + `zValidator`); wire in `container.ts` + `server.ts`. Integration
    test via `createTestDb()` + real Hono app (copy `workspaces.integration.test.ts`
    setup): POST→201 + appears in GET (newest first), POST 31× keeps 30 (prune works),
    DELETE unknown id → 404, DELETE / → 204 empties list
  - verify: `pnpm --filter @repo/server exec vitest run src/features/notifications/notifications.integration.test.ts` green
  - files: `notifications.controller.ts`, `index.ts`, `container.ts`, `server.ts`, `notifications.integration.test.ts`
- [x] 6. **Add WS route + adapter + WS integration test**
  - do: `notifications.ws-adapter.ts` — `onOpen` sends snapshot then subscribes
    `onCreated/onDeleted/onCleared` (JSON.stringify each frame, guard `ws.readyState === 1`),
    cleanup on close/error (pty.ws-adapter pattern). Add
    `.get("/ws", upgradeWebSocket(...))` to the controller. WS integration test copying
    `pty.ws.integration.test.ts:49-77`: `createAdaptorServer({ fetch: app.fetch,
websocket: { server: new WebSocketServer({ noServer: true }) } })`, real client `ws`
    connects, asserts: first frame is snapshot; `fetch POST /api/notifications` then
    pushes a `notification.created` frame; DELETE pushes `notification.deleted`; multiple
    clients both receive broadcasts
  - verify: `pnpm --filter @repo/server exec vitest run src/features/notifications/notifications.ws.integration.test.ts` green
  - files: `notifications.ws-adapter.ts`, `notifications.controller.ts`, `notifications.ws.integration.test.ts`
- [x] 7. **Full gate + manual smoke test**
  - do: run the full check suite, then boot the dev server and exercise the API by hand
  - verify: `pnpm --filter @repo/server test && pnpm run lint && pnpm run check-types` all green; with `pnpm run dev` running:
    `curl -s -X POST localhost:4122/api/notifications -H 'content-type: application/json' -d '{"type":"info","title":"t","message":"m"}'` returns 201, and
    `curl -s localhost:4122/api/notifications` lists it (WS check optional:
    `npx wscat -c ws://localhost:4122/api/notifications/ws` shows the snapshot)
  - files: —

## Done when

- [x] `pnpm --filter @repo/server test` passes (unit + both integration files)
- [x] `pnpm run lint && pnpm run check-types` pass repo-wide
- [x] The 4 REST endpoints behave per the API contract table (smoke-tested with curl)
- [x] A WS client receives `snapshot` on connect and `notification.created` when another
      client POSTs

## Notes for implementer

- Migration SQL from `db:generate` gets committed (repo convention).
- Keep everything sync — `better-sqlite3` is synchronous; services must not return
  Promises (workspaces service is the reference).
- `notifications.cleared` frame carries no payload — clients should empty their cache on
  receipt.
- Follow-up plan (not this one): frontend consumption in
  `docs/plan/20260821-notifications-frontend-webapp.md`.
