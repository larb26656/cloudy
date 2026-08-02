# AGENTS.md — `@repo/server`

Backend Hono app library. All backend-specific conventions live here.

## Feature Structure

Each feature lives in `packages/server/src/features/<feature>/`:

| File | Responsibility |
| --- | --- |
| `model.ts` | `XxxModel = { dtoSchema, querySchema, createSchema, updateSchema }` (Zod) + exported types |
| `repository.ts` | `class XxxRepository` — Drizzle queries only. Throws plain `Error` on internal failures |
| `service.ts` | Business logic via factory function. Throws domain errors |
| `index.ts` | `export function createXxxApp({ xxxService })` — returns a `new Hono()` sub-app |
| `*.test.ts` | Unit test for the service (mock the repository) |
| `*.integration.test.ts` | Integration test hitting the Hono app backed by in-memory SQLite |

## Wiring

- **DI:** manual via `packages/server/src/container.ts` — `initContainer(config)` constructs all DB client + repositories + services as module-level singletons
- **Route composition:** in `packages/server/src/server.ts` (`createApp`) under `/api/<feature>`
- **AppType:** `export type AppType = ReturnType<typeof createApp>`

## Database

- Tables: Drizzle's `sqliteTable` in `src/db/schema/<entity>.ts`; re-export from `src/db/schema/index.ts`
- Export `type FooRecord = typeof foo.$inferSelect` and `type NewFoo`
- `better-sqlite3` (synchronous) — `DbClient` (`src/db/client.ts`) owns the connection
- `runMigrations(dbPath)` applies SQL from `packages/server/drizzle/`
- Timestamps: `integer("created_at", { mode: "timestamp" })` with `.default(sql`(unixepoch())`)`
- Tests: `createTestDb()` / `closeTestDb(db)` from `src/db/test-utils.ts`

## Error Handling

- **Services** throw domain error subclasses (`WorkspaceNotFoundError`, `WorkspaceConflictError`). Do NOT throw `HTTPException`
- **Repositories** throw plain `Error` for internal failures; return `null`/empty for "not found"
- **Routes/controllers** catch domain errors and re-throw as `HTTPException(status, { message })`
- **Tests:** `await expect(svc.get('x')).rejects.toMatchObject({ status: 404 })`

## Validation & Types

- Define request/response shapes with **Zod** in `model.ts`
- Derive TS types via `z.infer` / `z.input`
- Never hand-write parallel DTO types
- Route validation: use `hono-openapi`'s `describeRoute(...)`, `validator('query' | 'json', schema)`, `resolver(schema)`

## Code Style

- TypeScript strict mode (`noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`)
- ESM only — `import`/`export`, no `require()`/CommonJS
- `import type { Foo }` for types-only imports (`verbatimModuleSyntax`)
- Service classes end in `Service` (`MemoryService`), repositories in `Repository`
- Route factory functions: `createXxxApp`
- No comments unless asked; JSDoc on exported APIs only

## Commands

```sh
pnpm --filter @repo/server test              # all tests (unit + integration)
pnpm --filter @repo/server exec vitest run src/path/to/file.test.ts
pnpm --filter @repo/server exec vitest run -t "test name pattern"
pnpm --filter @repo/server exec vitest --project unit run
pnpm --filter @repo/server exec vitest --project integration run
pnpm --filter @repo/server db:generate      # after schema edits
pnpm --filter @repo/server db:studio       # inspect data
```
