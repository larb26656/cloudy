---
title: Add soft-delete to Memory domain
slug: add-soft-delete-memory
id: 20260802-add-soft-delete-memory
status: ready
created: 2026-08-02
source: planning session 2026-08-02
---

# Plan: Add soft-delete to Memory domain

## Why

`Memory` rows are hard-deleted on `DELETE /api/memory/:id`. The audit table
(`packages/database/src/schema/audit.ts:14`) holds `memoryId` foreign keys that orphan on
delete, breaking history reports. We want deletes to flag rows as deleted (preserving
audits) while excluding them from default queries.

## Target file

| Path | Action |
| --- | --- |
| `packages/database/src/schema/memory.ts` | edit — add `deletedAt` column |
| `packages/database/drizzle/0001_*.sql` | create — generated migration |
| `packages/server/src/features/memory/repository.ts` | edit — filter `deletedAt IS NULL` in reads, set `deletedAt = now()` on delete |
| `packages/server/src/features/memory/service.ts` | edit — `delete` becomes soft-delete; 404 on already-deleted rows |

Four files, but tightly coupled — they all change together for one feature. Still
single-feature scope.

## Context the new session needs

- The Memory feature follows the standard layout in the repo root `AGENTS.md`
  ("Backend conventions"): `model.ts` (Zod), `repository.ts` (Drizzle, throws plain
  `Error`), `service.ts` (business logic, throws `HTTPException`), `index.ts` (Hono
  sub-app). Read that section first.
- `repository.ts` currently does `db.delete(memoryTable).where(eq(id, id))` around line 60.
  Replace with `db.update(memoryTable).set({ deletedAt: new Date() }).where(eq(id, id))`.
- Read queries (`list`, `get`) need a `.where(isNull(deletedAt))` clause — without it,
  soft-deleted rows leak back into the API. See the current `list` at
  `packages/server/src/features/memory/repository.ts:42`.
- PGlite only — no raw SQL client. Migrations go through drizzle-kit (`db:generate`).
- Conventions: no comments unless asked; camelCase for vars, PascalCase for types;
  repositories return `null` for not-found, services translate that to
  `HTTPException(404)`.
- The MemoryDto Zod schema must NOT gain a `deletedAt` field — soft-deleted rows should be
  invisible to the API surface.

## Tasks

- [ ] 1. Add `deletedAt: timestamp("deleted_at")` column to the `memory` table definition
  - verify: `pnpm --filter @repo/database check-types`
  - files: `packages/database/src/schema/memory.ts`
- [ ] 2. Generate the migration
  - verify: `pnpm --filter @repo/database db:generate` writes a new SQL file under
    `packages/database/drizzle/`
  - files: `packages/database/drizzle/`
- [ ] 3. Update repository reads to filter `deletedAt IS NULL`, and change `delete` to
      soft-delete
  - verify: `pnpm --filter @repo/server check-types`
  - files: `packages/server/src/features/memory/repository.ts`
- [ ] 4. Update service `get` to return 404 on already-deleted rows; keep `delete`
      returning void
  - verify: `pnpm --filter @repo/server exec vitest run src/features/memory/memory.service.test.ts`
    passes, including a new "delete then get returns 404" case
  - files: `packages/server/src/features/memory/service.ts`,
    `packages/server/src/features/memory/memory.service.test.ts`
- [ ] 5. Full check
  - verify: `pnpm --filter @repo/server test && pnpm run lint && pnpm run check-types`
    all green
  - files: —

## Done when

- [ ] `DELETE /api/memory/:id` on an existing row sets `deleted_at` instead of removing
      the row
- [ ] `GET /api/memory/:id` on a soft-deleted row returns 404
- [ ] `GET /api/memory` does not include soft-deleted rows
- [ ] `pnpm --filter @repo/server test` passes (including the new "delete then get 404"
      test)
- [ ] `pnpm run lint && pnpm run check-types` clean

## Notes for implementer

- Run `pnpm --filter @repo/database db:generate` after the schema edit — the migration SQL
  must be committed alongside the schema change (per repo `AGENTS.md`).
- Don't add a `deletedAt` field to `MemoryDto`. The flag is internal — exposing it through
  the API would leak the soft-delete mechanism to clients.
- If you find yourself wanting to add a "restore" endpoint, stop — that's out of scope.
  Open a follow-up plan instead.
