# AGENTS.md

Guide for AI coding agents working in this repository. Read this before making changes,
then read the **nested `AGENTS.md`** for the app/package you're working in (see below).

## Repository Overview

`cloudy` is a pnpm + Turborepo monorepo: a bundled CLI server (Hono) plus a React frontend,
sharing a Drizzle/PGlite database and type-safe API contracts.

```
apps/
  server/        `cloudy` CLI binary — bundles @repo/server via tsup (host 4122)
  web-app/       React 19 + Vite + TanStack Router frontend (dev port 3001) — the web UI
packages/
  contracts/     Type-only facade re-exporting @repo/server types for the browser
  database/      Drizzle ORM + PGlite (WASM Postgres); schema, migrations, test-utils
  server/        Hono app library — routes, services, repositories; has vitest tests
  eslint-config/ Shared ESLint flat configs: base, next-js, react-internal
  typescript-config/  Shared tsconfig bases: base, vite-react, react-library, nextjs
scripts/         copy-assets.ts, generate-package.ts (scaffolds new packages)
```

Package naming: apps use their folder `name` (`server`, `web-app`); libraries use
`@repo/<name>` (`@repo/server`, `@repo/database`, `@repo/contracts`). Depend on workspace
packages via `"@repo/x": "workspace:*"`.

### Nested AGENTS.md (read the one matching your work)

- [`apps/server/AGENTS.md`](apps/server/AGENTS.md) — the `cloudy` CLI binary: bundling,
  `serve` flags, the build/copy-assets pipeline, what belongs here vs. in `@repo/server`.
- [`apps/web-app/AGENTS.md`](apps/web-app/AGENTS.md) — the React UI (authoritative for
  everything frontend): stack, boot sequence, the Tab abstraction, Zustand stores map, the
  two-backend data layer, Desk node workflow, Storybook, testing matrix.

`packages/server` and `packages/database` conventions are still inline below (they don't
have their own `AGENTS.md` yet).

## Build / Lint / Typecheck / Test

All commands run from the repo root unless noted. Turborepo orchestrates and caches.

### Common (root)

```sh
pnpm install
pnpm run dev              # dev all apps concurrently (server 4122, web-app 3001)
pnpm run build            # turbo run build (all)
pnpm build:full           # build + copy-assets (drizzle migrations + web assets into dist/)
pnpm run lint             # turbo run lint (all packages)
pnpm run check-types      # turbo run check-types (all packages)
pnpm run format           # prettier --write "**/*.{ts,tsx,md}" (no .prettierrc — defaults)
```

### Targeting a single package

Use `pnpm --filter <name>` (e.g. `pnpm --filter @repo/server lint`) or
`pnpm run <script> --filter=<name>`. Scripts per package: `build`, `dev`, `lint`,
`check-types`, `clean`; `@repo/server` and `@repo/database` also have `test`, `test:ui`,
`test:coverage`.

### Tests

`@repo/server` has two vitest projects configured in `packages/server/vitest.config.ts`:

- `unit` — matches `src/**/*.test.ts`, **excludes** `*.integration.test.ts`
- `integration` — matches `src/**/*.integration.test.ts` (real in-memory PGlite via
  `createTestDb`)

```sh
pnpm --filter @repo/server test                                   # all tests (both projects)
pnpm --filter @repo/server exec vitest run src/utils/date.utils.test.ts   # single FILE
pnpm --filter @repo/server exec vitest run -t "should convert Date"        # single TEST
pnpm --filter @repo/server exec vitest --project unit run         # only unit project
pnpm --filter @repo/server exec vitest --project integration run  # only integration project
pnpm --filter @repo/server exec vitest run --watch               # watch mode
```

Tests use `globals: true`. Mocking: `vitest-mock-extended` (`mock<T>()`, `MockProxy<T>`).

`@repo/database`: `pnpm --filter @repo/database test`
(`vitest run --pass-with-no-tests`).

`apps/web-app` has **three** vitest projects (`node`, `jsdom`, `storybook`) — see
[`apps/web-app/AGENTS.md`](apps/web-app/AGENTS.md#testing) for the matrix and per-project
commands.

### Database migrations

Migrations live in `packages/database/drizzle/`. After editing schema in
`packages/database/src/schema/*.ts`:

```sh
pnpm --filter @repo/database db:generate   # drizzle-kit generate
pnpm --filter @repo/database db:studio     # drizzle-kit studio (inspect data)
```

## Code Style

- **Language:** TypeScript strict mode everywhere (`packages/typescript-config/base.json`):
  `strict`, `noUncheckedIndexedAccess` (server/db; disabled in `web-app`), `noUnusedLocals`,
  `noUnusedParameters`. Target ES2022/ES2023, `module: ESNext`, `moduleResolution: Bundler`.
- **Modules:** ESM only (`"type": "module"`). Use ESM `import`/`export`, no `require`/CommonJS.
- **Type-only imports:** `verbatimModuleSyntax` is on for the frontend; always use
  `import type { Foo }` for types/values imported only for their type, even in backend code.
- **Formatting:** Prettier with default config (no `.prettierrc`). Run `pnpm run format`.
  Match the indentation/semicolons already present in the file you are editing.
- **No comments unless asked.** When you do comment, prefer JSDoc on exported APIs
  (see `packages/database/src/test-utils.ts`, `packages/contracts/src/index.ts` for style).
- **Naming:** `camelCase` for functions/variables, `PascalCase` for classes/types/interfaces/components,
  `kebab-case` only for generated/lowercase file names. Service classes end in `Service`
  (`MemoryService`), repositories in `Repository`. Route factory functions: `createXxxApp`.
- **Validation & types:** Define request/response shapes with **Zod** in a feature's `model.ts`,
  then derive TS types via `z.infer` / `z.input`. Never hand-write parallel DTO types.

## Backend conventions (`packages/server`)

Each feature lives in `packages/server/src/features/<feature>/` with a consistent layout:

| File                    | Responsibility                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model.ts`              | `XxxModel = { dtoSchema, querySchema, createSchema, updateSchema }` (Zod) + exported `type XxxDto / XxxQuery / CreateXxxInput / UpdateXxxInput`.                                                            |
| `repository.ts`         | `class XxxRepository { constructor(private db: AppDatabase) {} }` — Drizzle queries only. Maps DB rows → DTOs. Throws plain `Error` on internal failures (e.g. insert failed).                              |
| `service.ts`            | `class XxxService { constructor(private repository: XxxRepository) {} }` — business logic. Throws `HTTPException` from `hono/http-exception` with an HTTP `status` (404 when entity missing) and a message. |
| `index.ts`              | `export function createXxxApp({ xxxService })` — returns a `new Hono()` sub-app. Use `hono-openapi`'s `describeRoute(...)`, `validator('query' \| 'json', schema)`, and `resolver(schema)` on each route.   |
| `*.test.ts`             | Unit test for the service (mock the repository).                                                                                                                                                            |
| `*.integration.test.ts` | Integration test hitting the Hono app backed by an in-memory PGlite DB.                                                                                                                                     |

**Wiring:** manual DI via `packages/server/src/container.ts` — `initContainer(config)`
constructs all DB client + repositories + services as module-level singletons. Compose
route sub-apps in `packages/server/src/server.ts` (`createApp`) under `/api/<feature>`;
also wires CORS, `/api/health`, `/openapi`, and `/docs`. `export type AppType =
ReturnType<typeof createApp>`.

**Frontend ↔ backend contract:** `@repo/contracts` re-exports `AppType` **type-only** so the
browser never bundles Node-only server code. Frontend calls the API via `hono/client`:
`hc<AppType>(url)`. **Never** add a value (runtime) export to `@repo/contracts` — only
`export type`.

## Database conventions (`packages/database`)

- Define tables with Drizzle's `pgTable` in `src/schema/<entity>.ts`; re-export from
  `src/schema/index.ts`. Export `type FooRecord = typeof foo.$inferSelect` and `type NewFoo`.
- PGlite (WASM Postgres) only — no external Postgres server. `DbClient` (`src/client.ts`)
  owns the connection; `runMigrations(dbPath)` applies the SQL in `drizzle/`.
- Tests use `createTestDb()` / `closeTestDb(db)` from `src/test-utils.ts` (in-memory PGlite
  + migrations applied). Import via `import { createTestDb } from "@repo/database"`.

## Frontend (`apps/web-app`)

The frontend is documented in full in [`apps/web-app/AGENTS.md`](apps/web-app/AGENTS.md).
Quick orientation: it's React 19 + Vite + TanStack Router/Query + Zustand + Tailwind v4 +
shadcn/ui, structured as a tabbed "desktop IDE". It talks to **two** backends — the cloudy
Hono server (typed RPC via `@repo/contracts`) and an opencode instance (via
`@opencode-ai/sdk`). Path alias `@/*` → `src/*`; styling helper `cn(...)` from
`src/lib/utils.ts`. For architecture, the Tab registry, stores, data layer, the Desk
node-adding workflow, Storybook, and the test matrix, **read the nested guide.**

## Error handling

- **Services** throw `HTTPException(status, { message })` (typically `404` for missing
  entities). Do not catch-and-return error objects; let Hono translate exceptions into HTTP
  responses.
- **Repositories** throw plain `Error` for unexpected/internal failures; return `null`/empty
  results for "not found" so the service can decide the HTTP status.
- **Tests** assert on both the thrown type and `status`: e.g.
  `await expect(svc.get('x')).rejects.toMatchObject({ status: 404 })`.

## Imports & Module Syntax

- Use `import type { Foo }` for types used only as types (frontend: always; backend: preferred).
- ESM only — no `require()`, no CommonJS.
- Barrel files (`index.ts`) re-export from sibling modules; avoid deep relative imports
  across features.
- Path aliases: `@/*` maps to `src/*` in frontend apps.

## Workflow checklist

1. Read the nested `AGENTS.md` for the app/package you're touching.
2. Make targeted, surgical edits — read the surrounding code and imports first.
3. After backend changes touching types: run `pnpm run check-types` to validate the graph.
4. After schema changes: run `pnpm --filter @repo/database db:generate` and commit the SQL.
5. Always run lint + typecheck before finishing: `pnpm run lint && pnpm run check-types`.
6. Run relevant tests:
   - Unit only: `pnpm --filter @repo/server exec vitest --project unit run`
   - Integration only: `pnpm --filter @repo/server exec vitest --project integration run`
   - Single file: `pnpm --filter @repo/server exec vitest run src/path/to/file.test.ts`
   - Single test: `pnpm --filter @repo/server exec vitest run -t "test name pattern"`
   - Frontend: see [`apps/web-app/AGENTS.md`](apps/web-app/AGENTS.md#testing).
7. Do not commit unless explicitly asked. Never commit `.env*`, `dist/`, or `*.tgz`.
