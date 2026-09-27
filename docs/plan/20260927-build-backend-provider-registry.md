---
title: Build Backend Provider Registry
slug: build-backend-provider-registry
id: 20260927-build-backend-provider-registry
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Build Backend Provider Registry

## Why

Cloudy currently exposes OpenCode through a raw proxy, while provider normalization and
OpenCode SDK knowledge still live in the frontend. This makes the browser responsible for
provider-specific types and prevents adding another provider without changing frontend code.
Create a backend-owned provider registry and an OpenCode adapter that exposes the existing
provider-agnostic `@repo/ai-core` contracts; keep the raw proxy temporarily for migration.

## Target file

| Path                                                             | Action                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `packages/ai-core/src/provider.ts`                               | edit — define the provider adapter/registry-facing contracts and operation inputs    |
| `packages/ai-core/src/interaction.ts`                            | edit — add normalized interaction response input if required by the adapter contract |
| `packages/server/package.json`                                   | edit — add runtime dependencies for ai-core and the OpenCode SDK                     |
| `packages/server/src/providers/provider.errors.ts`               | create — provider-not-found and unsupported-operation domain errors                  |
| `packages/server/src/providers/provider.registry.ts`             | create — registry implementation and provider registration types                     |
| `packages/server/src/providers/opencode/opencode.adapter.ts`     | create — OpenCode SDK adapter, SSE subscription, and normalization boundary          |
| `packages/server/src/providers/opencode/opencode.mapper.ts`      | create — SDK-to-ai-core mapping, moved from frontend concerns                        |
| `packages/server/src/features/providers/providers.model.ts`      | create — Zod API schemas derived from ai-core-compatible DTOs                        |
| `packages/server/src/features/providers/providers.controller.ts` | create — provider/model/agent catalog routes and the provider SSE stream             |
| `packages/server/src/features/providers/index.ts`                | create — provider feature barrel                                                     |
| `packages/server/src/container.ts`                               | edit — construct the registry and OpenCode adapter                                   |
| `packages/server/src/server.ts`                                  | edit — mount provider routes                                                         |
| `packages/server/src/providers/*.test.ts`                        | create — registry and adapter unit tests                                             |
| `packages/server/src/features/providers/*.integration.test.ts`   | create — catalog API integration tests                                               |

## Context the new session needs

- `packages/ai-core/src/provider.ts:6-28` already defines `ProviderCapabilities`,
  `ProviderInfo`, and `ProviderMessageRequest`, but explicitly does not yet define the
  runtime adapter boundary. Keep this package dependency-free and type-only.
- `packages/ai-core/src/model.ts:1-22` is the canonical model vocabulary. Use `providerId`,
  `modelId`, and `ModelCapabilities`; do not reintroduce frontend names `providerID` or
  `modelID` in the new API.
- `packages/opencode/src/adapter.ts:58-218` contains the existing SDK-to-ai-core mapping
  for messages and parts. Reuse its behavior, including the `unknown` provider-part fallback
  and `metadata.raw`, but move the provider-specific implementation behind the backend
  adapter boundary rather than importing it into browser code.
- `packages/server/src/container.ts:12-47` is the manual DI composition root. The registry
  must be constructed there; do not add module-level singletons.
- `packages/server/src/server.ts:50-71` mounts Hono feature controllers. Add the provider
  controller under `/api/providers`; preserve `/oc` while frontend migration is in progress.
- `packages/server/AGENTS.md` requires Zod request/response schemas in feature model files,
  plain `Error` from repositories (not applicable to this registry), domain errors from
  services/ports, and route-level HTTP mapping. Follow ESM and type-only import rules.
- Round one is intentionally fixed to one provider with stable ID `opencode`. The registry
  API must not hard-code OpenCode behavior: a future registration should provide an adapter
  with the same contract and capabilities.
- SSE is a first-class provider operation. The server owns the browser-facing connection,
  forwards an adapter's normalized `ChatEvent` values as `text/event-stream`, propagates
  request aborts, and does not expose the OpenCode event payload or SDK stream to the browser.
- Do not add database-backed user provider setup in this plan. The registry uses static
  composition and `opencodeApiBase` from `AppConfig`; configuration-driven instances are a
  follow-up once the API boundary is proven.

## Tasks

- [x] 1. Extend `@repo/ai-core` with the provider adapter contract and normalized operation types
  - verify: `pnpm --filter @repo/ai-core check-types && pnpm --filter @repo/ai-core lint`
  - files: `packages/ai-core/src/provider.ts`, `packages/ai-core/src/interaction.ts`, `packages/ai-core/src/index.ts`
- [x] 2. Implement the registry with stable provider lookup and capability-aware errors
  - verify: `pnpm --filter @repo/server exec vitest run src/providers/provider.registry.test.ts`
  - files: `packages/server/src/providers/provider.registry.ts`, `packages/server/src/providers/provider.errors.ts`, `packages/server/src/providers/provider.registry.test.ts`
- [x] 3. Implement the OpenCode adapter, including normalized SSE subscription and cleanup
  - verify: `pnpm --filter @repo/server exec vitest run src/providers/opencode`
  - files: `packages/server/src/providers/opencode/opencode.adapter.ts`, `packages/server/src/providers/opencode/opencode.mapper.ts`, `packages/server/src/providers/opencode/*.test.ts`, `packages/server/package.json`
- [x] 4. Add provider catalog and SSE route schemas/controllers
  - verify: provider integration tests return `200` with provider ID `opencode`, normalized `providerId`/`modelId` fields, `Content-Type: text/event-stream`, and normalized event frames
  - files: `packages/server/src/features/providers/providers.model.ts`, `packages/server/src/features/providers/providers.controller.ts`, `packages/server/src/features/providers/index.ts`, `packages/server/src/features/providers/*.integration.test.ts`
- [x] 5. Wire the registry into the container and server composition
  - verify: `pnpm --filter @repo/server check-types && pnpm --filter @repo/server test`
  - files: `packages/server/src/container.ts`, `packages/server/src/server.ts`
- [x] 6. Run repository validation before frontend migration starts
  - verify: `pnpm run lint && pnpm run check-types`
  - files: —

## Done when

- [x] Backend owns an injectable `ProviderRegistry` and statically registers exactly one
      provider with ID `opencode`.
- [x] OpenCode SDK types and mapping logic are not required by the provider catalog controller
      or exposed in its response types.
- [x] `GET /api/providers` returns normalized provider/model/agent data through Hono RPC types.
- [x] `GET /api/providers/:providerId/events` is an SSE endpoint that emits normalized
      `ChatEvent` frames, closes cleanly on client abort, and does not leak OpenCode payloads.
- [x] Unknown provider IDs and unsupported capabilities produce intentional HTTP errors.
- [x] Existing `/oc` proxy behavior remains green during migration.
- [x] `pnpm run lint && pnpm run check-types` passes.

## Notes for implementer

- Keep `ProviderRegistry` in the server composition layer, not in `@repo/ai-core`.
- Do not introduce dynamic plugin loading, database provider configuration, or a second
  provider in this plan.
- Preserve the current OpenCode mapper's handling of text, reasoning, tool, file, diff,
  subtask, compaction, lifecycle, retry, and unknown parts.
- Add tests for malformed/unknown provider payloads; provider SDK payloads are external input.
