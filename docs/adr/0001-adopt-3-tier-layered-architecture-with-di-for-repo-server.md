---
id: 0001-adopt-3-tier-layered-architecture-with-di-for-repo-server
title: Adopt 3-tier layered architecture with DI for @repo/server
status: accepted
date: 2026-08-02
---

# ADR 0001: Adopt 3-tier layered architecture with DI for @repo/server

## Status

Accepted on 2026-08-02.

## Context

`@repo/server` started with a simple per-feature convention documented in the
repo `AGENTS.md` (backend conventions section): each feature folder had a
`model.ts` (Zod schemas), a `repository.ts` class wrapping Drizzle, a
`service.ts` class doing business logic, and an `index.ts` exporting a
`createXxxApp({ xxxService })` Hono sub-app. Wiring happened through module-level
singletons in `src/container.ts`. This worked and shipped several features
(memory, settings, proxy).

As the package grew the convention started to creak in three concrete ways:

1. **Services were welded to Hono.** They imported `HTTPException` from
   `hono/http-exception` and threw it directly. Unit-testing a service meant
   either spinning up the Hono app (slow, integration-tier only) or pulling
   `hono` into the test's dependency graph just to assert on thrown shapes. The
   PTY feature (`features/pty`) made this worse: `node-pty` is a native module,
   so any test that imported the service transitively loaded native bindings.
2. **Repositories were classes with no interface.** Swapping a `MemoryRepository`
   from in-memory to Drizzle-backed (or PTY from in-process to a remote PTY
   daemon) meant editing every call site, because consumers held a concrete
   class. The PTY feature especially needed an interface boundary — its state
   lives in closures over `Map<id, Session>` plus native `node-pty` handles, and
   we wanted to test the service logic against a fake repository.
3. **Two test tiers, one of them unusable.** The vitest config already declared
   a `unit` project (no DB, no Hono) and an `integration` project (real PGlite),
   but the unit project was nearly empty because nothing in a service was
   unit-testable without Hono or a DB.

Forces pulling in different directions: we wanted testability and a future
Drizzle swap path, but we also had to preserve the `AppType` exported through
`@repo/contracts` (the web-app calls the API via `hc<AppType>`), which meant
route paths and validator schemas could not drift. We also had a stated team
preference for factory functions over classes (the existing `createXxxApp`
pattern), so any solution should extend that rather than fight it.

## Decision

We adopt a **3-tier layered architecture (Controller / Service / Repository)
with dependency inversion**, implemented entirely with factory functions, for
all features in `@repo/server`.

The dependency rule: controllers import the service type + Hono; services import
the repository interface + Zod models + domain errors and never import `hono`,
`node-pty`, `ws`, or `drizzle`; repository implementations own the infra and
import the interface, never Hono. Services throw `DomainError` subclasses
(`SessionNotFoundError`, `MissingApiBaseError`, …) defined in
`src/shared/domain-error.ts`; a single error-middleware in
`src/presentation/error-middleware.ts` catches them and maps to HTTP status.
Wiring happens in `createContainer(config)`, which returns
`{ ptyService, proxyService }` consumed by the route composers in `server.ts`.

Full design notes and per-phase migration steps live in
`packages/server/REFACTOR_PLAN.md`; the phased implementation plan is
`docs/plan/20260802-server-3tier-refactor.md`.
## Consequences

- **Positive:**
  - Service layer is framework-free — unit tests use plain object literal mocks
    of the repository interface, no `vitest-mock-extended`, no Hono context,
    no native modules pulled in.
  - Repository behind an explicit interface means the in-memory PTY store can be
    swapped for a Drizzle-backed store (or a remote PTY daemon) without touching
    the service or controller.
  - Centralized error handling — one middleware maps every `DomainError`
    subclass to its HTTP status, so routes stop hand-rolling `HTTPException`
    calls and status codes stay consistent.
  - 3-tier vocabulary (Controller / Service / Repository) is familiar to most
    backend contributors, lowering onboarding friction versus a bespoke layout.

- **Negative:**
  - More files per feature: PTY went from 4 files to 10 (`pty.controller.ts`,
    `pty.service.ts`, `pty.repository.ts`, `in-memory-pty.repository.ts`,
    `pty.model.ts`, `pty.errors.ts`, `pty.ws-adapter.ts`, `shell-resolver.ts`,
    `pty.service.test.ts`, `index.ts`). The indirection is real cost for thin
    features like proxy, which has no state at all.
  - Closure-based repository state (Maps in `createInMemoryPtyRepository`) is
    harder to inspect during debugging than class fields would be — you can't
    `console.log(this.sessions)` from a test, you have to go through the public
    API.
  - Slight impedance mismatch with `hono-openapi` / `zValidator`, which both
    want schemas and route metadata declared at the controller boundary. The
    service can't carry that metadata without re-importing Hono, so the
    controller owns the OpenAPI descriptions even though it owns no logic.

- **Neutral:**
  - Contributors need to learn the `DomainError` → middleware convention before
    adding new error paths; throwing `HTTPException` directly from a service is
    now an anti-pattern.
  - `src/container.ts` is the single DI wiring point and must be updated
    whenever a feature is added or a repository constructor signature changes.
  - The backend conventions section of the root `AGENTS.md` still documents the
    old class-based layout — it needs an update pass to match this decision.

## Alternatives Considered

- **Strict Clean Architecture (entity layer + per-use-case interactors +
  presenter/controller split)** — rejected because the domain is anemic. PTY and
  proxy are thin wrappers over infra; there is no business rule richness to
  justify the ceremony of separate entity objects and one-interactor-per-use-
  case. The indirection cost would dwarf the testability gain.

- **Keep the existing class-based singletons and add tests around them** —
  rejected because it does not solve the root coupling: services would still
  import `HTTPException` from Hono, so "unit" tests would still drag the
  framework in, and repositories without interfaces would still need call-site
  edits for any future persistence swap. It would have left the empty `unit`
  vitest project empty forever.

- **Hexagonal / ports-and-adapters layout (nested `domain/`, `application/`,
  `adapters/` folders per feature)** — rejected as isomorphic to Clean
  Architecture for our purposes: same indirection cost, same anemic-domain
  mismatch, just a different folder naming. We kept the dependency-inversion
  idea (the one valuable piece) and dropped the nested folder ceremony in favor
  of flat per-feature files.

## Related

- Implementation plan: `docs/plan/20260802-server-3tier-refactor.md`
- Full design notes + phased migration: `packages/server/REFACTOR_PLAN.md`
- Root `AGENTS.md` → Backend conventions section (pending update to match this
  decision)
- Vitest project split (`unit` vs `integration`):
  `packages/server/vitest.config.ts`
