---
title: Refactor @repo/server to 3-tier + DI
slug: server-3tier-refactor
id: 20260802-server-3tier-refactor
status: done
created: 2026-08-02
source: conversion of packages/server/REFACTOR_PLAN.md into plan format
---

# Plan: Refactor @repo/server to 3-tier + DI

> **Status: done.** This plan is a historical record. All four phases shipped and
> verify-commands below still pass on the current tree. Original free-form plan
> lived at `packages/server/REFACTOR_PLAN.md`.

## Why

`@repo/server` previously mixed Hono, `node-pty`, and stateful class singletons in
the same modules — services imported `hono` directly, making them untestable without a
full HTTP context, and a Drizzle swap-in was blocked because repository infra was
inlined into services. The goal was a pragmatic 3-tier layout (Controller / Service /
Repository) with dependency inversion via factory functions, so the service layer is
framework-free, repository state lives behind an interface, and tests use plain object
mocks. Not strict Clean Architecture — the domain is anemic, so per-use-case
interactors / entity layer / presenter split would not pay back.

## Target file

All four phases shipped. The full file footprint touched by the refactor:

| Path | Action |
| --- | --- |
| `packages/server/src/shared/domain-error.ts` | create |
| `packages/server/src/shared/date.utils.ts` (+ `.test.ts`) | create |
| `packages/server/src/presentation/error-middleware.ts` | create |
| `packages/server/src/container.ts` | edit — replaced module singletons with `createContainer(config)` |
| `packages/server/src/server.ts` | edit — `.onError(domainErrorHandler)`, route via controllers |
| `packages/server/src/server/createServer.ts` | edit — `ensureConfigFile`+`parseConfig`+`createContainer`+`attachPtyWebSockets` |
| `packages/server/src/config/config.ts` | edit — split `loadConfig` into `ensureConfigFile`+`parseConfig` |
| `packages/server/src/features/pty/pty.repository.ts` | create — interface + types |
| `packages/server/src/features/pty/in-memory-pty.repository.ts` | create — closure-based impl |
| `packages/server/src/features/pty/shell-resolver.ts` | create — shell/env helpers |
| `packages/server/src/features/pty/pty.service.ts` | create |
| `packages/server/src/features/pty/pty.controller.ts` | create |
| `packages/server/src/features/pty/pty.ws-adapter.ts` | create — `attachPtyWebSockets` + `pipeSession` |
| `packages/server/src/features/pty/pty.model.ts` | create |
| `packages/server/src/features/pty/pty.errors.ts` | create — `SessionNotFoundError` |
| `packages/server/src/features/pty/pty.service.test.ts` | create — object-literal mock |
| `packages/server/src/features/pty/index.ts` | create — re-export controller + WS adapter |
| `packages/server/src/features/pty/{model,service,repository,index,service.test}.ts` (old class-based) | delete |
| `packages/server/src/features/proxy/proxy.service.ts` | create — `proxy(request: Request)` |
| `packages/server/src/features/proxy/proxy.controller.ts` | create |
| `packages/server/src/features/proxy/proxy.errors.ts` | create — `MissingApiBaseError` |
| `packages/server/src/features/proxy/proxy.integration.test.ts` | create |
| `packages/server/src/features/proxy/{model,service,index}.ts` (old) | delete |
| `packages/server/src/lib/`, `packages/server/src/utils/` | delete — consolidated into `src/shared/` |

## Context the new session needs

- **Dependency rule** (must be preserved on any future edit):
  - `controller` imports `service` (type) + `hono`.
  - `service` imports the repository interface + `model` + `errors`. **Never** imports
    `hono`, `node-pty`, `ws`, or `drizzle`.
  - repository impl imports the interface and owns infra (`node-pty`, `fetch`).
    Never imports `hono`.
- **Impl style: factory functions, no classes.** Repository state lives in closure
  over `Map`. See `in-memory-pty.repository.ts` — `createInMemoryPtyRepository()`
  returns `{ spawn, get, resize, write, kill, onData, onExit }` built over private Maps.
  Aligns with the existing `createXxxApp` / `createXxxController` / `createXxxService`
  pattern.
- **Layout:** flat per-feature (`features/<feature>/<feature>.*.ts`). No nested
  `domain/` / `application/` / `adapters/` folders.
- **Errors:** `DomainError` subclasses thrown from services
  (`packages/server/src/shared/domain-error.ts`); Hono middleware
  (`packages/server/src/presentation/error-middleware.ts`) catches them and maps to HTTP
  status. Services stay framework-free — they never touch `HTTPException` directly.
- **Config split:** `loadConfig` was split so the pure parse stays side-effect-free.
  `ensureConfigFile(configDir, defaults?)` writes the default `config.json` on first
  run and returns the path (`config.ts:56`); `parseConfig({ configPath, configDir,
  cliFlags })` does layered merge (`config.ts:71`). `createServer` calls both
  (`createServer.ts:22-35`).
- **DI wiring:** `createContainer(config)` (`container.ts:11`) builds
  `{ ptyService, proxyService }`; no module-level singletons. `createServer` passes the
  container into `createApp({ container })` (`server.ts:13`) and into
  `attachPtyWebSockets(server, container.ptyService)` (`createServer.ts:57`).
- **Route paths unchanged on purpose** — `AppType` signature stayed identical so
  `@repo/contracts` and the frontend `hc<AppType>` consumer kept compiling. Any
  future route/validator change must re-run repo-wide `check-types`.
- **Repo conventions** (from root `AGENTS.md`): ESM only, `import type` for
  type-only imports, `noUncheckedIndexedAccess` on, no comments unless asked,
  camelCase vars / PascalCase types, Zod for DTOs (no hand-written parallel types).
- **Gotcha:** PTY WS attach is done on the raw Node `http.Server` after `serve()`
  returns — `@hono/node-server` 1.19 has no built-in WS bridge. `attachPtyWebSockets`
  casts `ServerType` to `Server` because the runtime type is HTTP1-only (see
  comment at `createServer.ts:52-57`).

## Tasks

All `[x]` — completed.

- [x] 1. **Phase 0 — scaffolding:** add `shared/domain-error.ts`,
      `presentation/error-middleware.ts`, `createContainer(config)`; wire
      `.onError(domainErrorHandler)` in `server.ts`.
  - verify: `pnpm --filter @repo/server check-types && pnpm --filter @repo/server test && pnpm run lint`
  - files: `packages/server/src/shared/domain-error.ts`,
    `packages/server/src/presentation/error-middleware.ts`,
    `packages/server/src/container.ts`, `packages/server/src/server.ts`
- [x] 2. **Phase 1 — pty refactor:** split `features/pty/` into controller /
      service / repository (interface + in-memory impl) / model / errors /
      ws-adapter; rewrite service test with object-literal mock; rewire container
      and `createServer`.
  - verify: `pnpm --filter @repo/server check-types && pnpm --filter @repo/server test && pnpm run check-types`
  - files: `packages/server/src/features/pty/*`,
    `packages/server/src/container.ts`, `packages/server/src/server.ts`,
    `packages/server/src/server/createServer.ts`
- [x] 3. **Phase 2 — proxy refactor:** convert `ProxyService.proxyRequest(c)` to
      `proxy(request: Request): Promise<Response>`; add controller + errors;
      add integration test hitting `/oc/...` with mocked `fetch`.
  - verify: `pnpm --filter @repo/server exec vitest run --project integration`
  - files: `packages/server/src/features/proxy/*`,
    `packages/server/src/container.ts`, `packages/server/src/server.ts`
- [x] 4. **Phase 3 — shared cleanup:** consolidate `lib/` + `utils/` → `shared/`;
      split `loadConfig` into `ensureConfigFile` + `parseConfig`; remove leftover
      module-level singletons from `container.ts`.
  - verify: `pnpm --filter @repo/server check-types && pnpm --filter @repo/server test && pnpm run lint`
  - files: `packages/server/src/config/config.ts`,
    `packages/server/src/container.ts`, `packages/server/src/shared/`

## Done when

- [x] `createContainer(config)` returns `{ ptyService, proxyService }` and no
      module-level singletons remain (`packages/server/src/container.ts:11`)
- [x] PTY service imports neither `hono` nor `node-pty` — confirm with
      `rg -n "from \"hono\"|node-pty" packages/server/src/features/pty/pty.service.ts`
      (no matches)
- [x] `parseConfig` has no filesystem writes (side effects live in
      `ensureConfigFile` only) — `packages/server/src/config/config.ts:71`
- [x] `src/lib/` and `src/utils/` directories no longer exist; cross-cutting
      helpers live under `src/shared/`
- [x] `pnpm --filter @repo/server check-types && pnpm --filter @repo/server test && pnpm run lint`
      all green; repo-wide `pnpm run check-types` green (contracts + web-app still
      compile against unchanged `AppType`)

## Notes for implementer

- Plan is closed; no implementation expected. If reopening (e.g. adding a third
  feature), follow the per-feature layout above and add a new `create<Feature>App`
  route in `server.ts` under `/api/<feature>`.
- When adding a new domain error, extend `shared/domain-error.ts` and let
  `presentation/error-middleware.ts` map it — do **not** throw `HTTPException` from
  services.
- If you ever introduce persistence, add `createDrizzle<Feature>Repository()`
  implementing the existing interface; swap in `container.ts`. Services stay
  untouched by design.
- Original free-form plan kept at `packages/server/REFACTOR_PLAN.md` for the full
  risk register and decisions log; safe to delete once this file is the source of
  truth.
