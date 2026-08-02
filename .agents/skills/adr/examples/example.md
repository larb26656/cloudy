---
id: 0001-use-pglite-instead-of-external-postgres
title: Use PGlite (WASM Postgres) instead of an external Postgres server
status: accepted
date: 2026-01-15
deciders:
  - repo owner
---

# ADR 0001: Use PGlite (WASM Postgres) instead of an external Postgres server

## Status

Accepted on 2026-01-15.

## Context

`cloudy` ships as a single CLI binary (`apps/server`) that bundles a Hono app
via tsup and exposes a local HTTP server on port 4122. The web-app talks to it
over typed RPC. For the product to be useful, the server has to persist data
across restarts — memories, configurations, anything the user created in a
prior session.

The first instinct for "I need persistence in a Node app" is to reach for a
real Postgres instance. But `cloudy` is a personal/local tool, not a
multi-tenant SaaS. Asking the user to install Postgres, create a database,
manage credentials, and keep the server running before `cloudy` even starts
would destroy the "just run the binary" UX that's core to the product. The
installation friction alone would kill adoption — most non-engineer users
would bounce.

We also need real relational queries, joins, and a schema migration story —
this rules out the obvious "just dump JSON files" approach, and SQLite's
dialect drift from Postgres would make a future migration to hosted Postgres
(if the product ever grows a server-backed mode) much more painful than it
needs to be. We want Postgres flavor SQL now, without Postgres the server.

## Decision

We adopt **PGlite** (Postgres compiled to WASM, running in-process) as the
persistence layer, accessed through Drizzle ORM (`packages/database`).

PGlite gives us a real Postgres — same SQL dialect, same types, same behavior
— that runs inside the Node process with no separate server, no port, no
credentials, no install step. The database is a single file on disk.

## Consequences

- **Positive:**
  - Zero-configuration install — `cloudy` is genuinely a single binary, no
    "first install Postgres" step.
  - Same SQL dialect and types as hosted Postgres, so a future server-backed
    mode can reuse the schema, migrations, and most queries unchanged.
  - Drizzle ORM works against PGlite the same way it works against real
    Postgres, so the repository layer (`packages/server/src/features/*/repository.ts`)
    is portable.
  - Tests get an in-memory PGlite for free via `createTestDb()` in
    `packages/database/src/test-utils.ts` — no Docker, no Testcontainers, no
    flaky CI setup.

- **Negative:**
  - In-process means single-writer — no concurrent connections, no parallel
    workers hitting the same DB file. Fine for a local single-user tool;
    would be a hard blocker for a multi-tenant backend.
  - WASM Postgres is slower than native Postgres on heavy workloads. For
    `cloudy`'s read-mostly access pattern this is invisible, but it would be
    the wrong choice for a write-heavy service.
  - PGlite is a newer project than Postgres proper — smaller ecosystem of
    tooling, occasional WASM-specific quirks (e.g. file path handling,
    extension support is limited). We accept this lock-in.

- **Neutral:**
  - Contributors need to learn Drizzle + PGlite's specific quirks; raw `pg`
    client code from tutorials won't work here.
  - Schema changes flow through `pnpm --filter @repo/database db:generate`,
    not raw SQL — a slightly different workflow than plain Postgres.

## Alternatives Considered

- **External Postgres server** — rejected because it destroys the single-binary
  install story. The whole product premise is "just run `cloudy`", and requiring
  a running Postgres would eliminate most of our target users.

- **SQLite (via better-sqlite3)** — rejected because its SQL dialect differs
  from Postgres in ways that matter (types, JSON operators, RETURNING clauses,
  array columns). Migrating to hosted Postgres later would mean rewriting
  queries and re-testing the whole data layer. PGlite gives us the Postgres
  dialect for free.

- **JSON / flat-file storage** — rejected because we need relational queries,
  joins, and schema migrations. JSON works for tiny configs but breaks down
  fast once we have memories, tags, links between entities. No migration
  story, no query layer.

- **Embedded DuckDB** — considered briefly; rejected because it's optimized
  for analytics rather than OLTP-style row work, and its Postgres compatibility
  is partial. PGlite is a closer behavioral match.

## Related

- Implementation home: `packages/database/` (Drizzle schema, migrations,
  `DbClient`, `createTestDb`)
- `AGENTS.md` → Database conventions section codifies this decision as
  "PGlite only — no external Postgres server"
