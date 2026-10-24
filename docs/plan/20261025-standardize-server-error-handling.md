---
title: วางมาตรฐาน error handling ใน server
slug: standardize-server-error-handling
id: 20261025-standardize-server-error-handling
status: ready
created: 2026-10-25
source: planning session 2026-10-25
---

# Plan: วางมาตรฐาน error handling ใน server

## Why

`packages/server` มีทั้ง domain errors และ `throw new Error` ปะปนกัน ทำให้ error ที่ควรเป็น 4xx อาจกลายเป็น 500 และรูปแบบ response/การเปิดเผยข้อความไม่แน่นอน ผู้ใช้ต้องการมาตรฐานกลางที่แบ่งหน้าที่ชัดระหว่าง repository, service และ HTTP boundary โดยอิงแนวทาง Hono และใช้ได้กับ features/providers ที่มีอยู่

## Target file

| Path                                                   | Action |
| ------------------------------------------------------ | ------ |
| `packages/server/AGENTS.md`                            | edit   |
| `packages/server/src/shared/domain-error.ts`           | edit   |
| `packages/server/src/presentation/error-middleware.ts` | edit   |
| `packages/server/src/server.ts`                        | edit   |
| `packages/server/src/features/**`                      | edit   |
| `packages/server/src/providers/**`                     | edit   |
| `packages/server/src/lib/**`                           | edit   |
| `packages/server/src/**/*.test.ts`                     | edit   |

## Context the new session needs

- Hono exception guide: <https://hono.dev/docs/api/exception>. Hono `HTTPException` supports an HTTP status, message or custom `Response`, and `cause`; uncaught exceptions are handled at `app.onError`. Hono’s example preserves `HTTPException.getResponse()` and logs unexpected errors before returning a generic 500. `getResponse()` has no access to Context-set headers, so if a custom response is returned, account for Context headers where relevant.
- `packages/server/src/shared/domain-error.ts:1-54` already defines `DomainError` and common `NotFoundError`, `ValidationError`, `ConflictError`, and `UnauthorizedError`. Feature-specific errors subclass these (for example `features/sessions/sessions.errors.ts` and `features/workspaces/workspaces.errors.ts`). Keep services framework-independent; do not make them throw `HTTPException`.
- `packages/server/src/presentation/error-middleware.ts:6-28` is already registered globally from `packages/server/src/server.ts:62-68`. It maps `DomainError`, preserves `HTTPException`, and currently includes the unknown error’s message in the JSON 500 response. The global handler is the intended HTTP translation boundary; controllers should not duplicate catches/translations unless they need local recovery or a special protocol response.
- `packages/server/AGENTS.md:51-56` currently says controllers catch domain errors and rethrow `HTTPException`, which conflicts with the actual global handler. Update this guide as part of the change.
- Initial inventory found service-level plain errors with likely domain meaning in `features/cloudy-agent/cloudy-agent.service.ts:130-132`, `features/llm-connections/llm-connections.service.ts:117,136`, `features/settings/agents/settings.agents.service.ts:24-76`, and `features/settings/agent-providers/settings.agent-providers.service.ts:51,66`. Other plain errors in config parsing, provider protocol/adapters, OAuth/network code, stream handling, and tests may be intentional internal failures; classify each by semantics rather than mechanically replacing every `Error`.
- Repositories should continue returning `null`/empty values for normal absence and use plain `Error` (or preserve a meaningful `cause`) only for unexpected persistence/infrastructure failures, per `packages/server/AGENTS.md`. Tests must distinguish expected domain errors, expected HTTP responses, and sanitized unexpected 500s.

## Tasks

- [ ] 1. **Define the error taxonomy and layer responsibilities in `packages/server/AGENTS.md`, including the rule that unknown 500 responses never expose internal messages.**
  - verify: `rg -n 'DomainError|HTTPException|onError|Internal Server Error|Repository' packages/server/AGENTS.md`
  - files: `packages/server/AGENTS.md`
- [ ] 2. **Align `DomainError` base classes and status/kind typing with the agreed taxonomy, adding only categories required by actual service cases.**
  - verify: `pnpm --filter @repo/server check-types`
  - files: `packages/server/src/shared/domain-error.ts`
- [ ] 3. **Standardize the global Hono `onError` handler: preserve `HTTPException` responses, map domain errors to the agreed JSON shape, log unexpected errors, and return a generic sanitized 500.**
  - verify: `pnpm --filter @repo/server exec vitest run src/presentation/error-middleware.test.ts`
  - files: `packages/server/src/presentation/error-middleware.ts`, `packages/server/src/presentation/error-middleware.test.ts`, `packages/server/src/server.ts`
- [ ] 4. **Add/adjust focused handler tests for DomainError status mapping, Hono HTTPException behavior, unexpected Error sanitization, and non-Error thrown values.**
  - verify: `pnpm --filter @repo/server exec vitest run src/presentation/error-middleware.test.ts`
  - files: `packages/server/src/presentation/error-middleware.test.ts`
- [ ] 5. **Classify plain errors in services and convert only expected business outcomes (missing entities, conflicts, invalid actions/input) to typed domain errors.**
  - verify: `pnpm --filter @repo/server exec vitest --project unit run`
  - files: `packages/server/src/features/**`, `packages/server/src/lib/**`
- [ ] 6. **Review controllers, providers, adapters, config, and OAuth/streaming code; keep intentional infrastructure/protocol errors as internal errors and preserve causes when wrapping errors.**
  - verify: `rg -n 'throw new Error|throw new HTTPException|catch \(' packages/server/src`
  - files: `packages/server/src/features/**`, `packages/server/src/providers/**`, `packages/server/src/lib/**`, `packages/server/src/config/**`
- [ ] 7. **Update affected service/controller/integration tests to assert the standardized domain error types and API response contract, then run the server checks.**
  - verify: `pnpm --filter @repo/server test && pnpm run lint && pnpm run check-types`
  - files: `packages/server/src/**/*.test.ts`

## Done when

- [ ] Service code uses framework-independent typed domain errors for expected business failures; plain `Error` remains for unexpected/internal failures.
- [ ] One global `onError` policy handles HTTPException, DomainError, and unknown errors consistently; unknown 500 responses contain no internal exception message and are logged.
- [ ] `packages/server/AGENTS.md` describes the same policy implemented by the code, with no instruction to duplicate global translation in every controller.
- [ ] `pnpm --filter @repo/server test`, `pnpm run lint`, and `pnpm run check-types` pass.

## Notes for implementer

This is a cross-feature cleanup. Inventory and classify each `throw new Error`; do not mechanically convert errors thrown by config, provider protocols, network/OAuth code, test setup, or stream handling into HTTP/domain errors. Keep error responses backward compatible where practical, and treat any response-shape change as an explicit API contract decision. Follow the root workflow: run relevant tests plus lint and typecheck; do not commit unless requested.
