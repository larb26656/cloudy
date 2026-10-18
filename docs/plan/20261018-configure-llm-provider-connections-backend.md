---
title: Configure LLM Provider Connections Backend
slug: configure-llm-provider-connections-backend
id: 20261018-configure-llm-provider-connections-backend
status: completed
created: 2026-10-18
source: planning session 2026-10-18
---

# Plan: Configure LLM Provider Connections Backend

## Why

Cloudy currently registers a hard-coded DeepInfra LLM client in `container.ts`, so users cannot configure their own LLM connections through the app. Add config-backed API management for multiple connections, including multiple OpenAI-compatible endpoints and multiple model IDs per connection, and make one configured connection/model the default for calls that do not specify a model. Provider implementations and their registry already exist and must be reused rather than recreated.

## Target file

| Path                                                                   | Action                                                                                                           |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `packages/server/src/config/config.ts`                                 | edit — define persisted LLM connection/default config and compatibility behavior                                 |
| `packages/server/src/container.ts`                                     | edit — register configured clients and wire default selection into the runtime                                   |
| `packages/server/src/lib/llm-provider/types.ts`, `providers/openai.ts` | edit — describe type-specific settings fields for UI metadata                                                    |
| `packages/server/src/lib/llm-provider/create-llm.ts`                   | edit — expose provider type metadata and config validation                                                       |
| `packages/server/src/features/llm-providers/`                          | create — own LLM-specific schemas, service, controller, and tests, separate from agent/session provider settings |
| `packages/server/src/lib/llm-provider/create-llm.test.ts`              | edit — cover provider type metadata and client replacement                                                       |
| `packages/server/src/providers/cloudy/cloudy.adapter.ts`               | edit — read current default connection/model when a request has no explicit model                                |
| `packages/server/src/providers/cloudy/cloudy.adapter.test.ts`          | edit — verify default and explicit model selection                                                               |

## Context the new session needs

- The LLM implementation already exists in `packages/server/src/lib/llm-provider/`. `createLLM()` registers provider definitions and clients, returns provider/client/model lists, and can delete clients; `registerClient()` rejects duplicate IDs. Reuse this API and extend it only as needed for runtime updates.
- `packages/server/src/container.ts:53-82` registers the OpenAI-compatible definition and one hard-coded `deepinfra` client with a model sourced from env/default values. Replace that hard-coded client setup with config-driven clients while preserving provider registration and the existing Cloudy adapter.
- `packages/server/src/lib/llm-provider/providers/openai.ts:5-19` uses an API key and optional base URL; this is the existing OpenAI-compatible provider implementation. Multiple connections can use the same provider type with distinct IDs/config values.
- `packages/server/src/providers/cloudy/cloudy.adapter.ts:20-27,160-167` receives default provider/model as fixed construction arguments, lists models from the LLM registry, and chooses request model overrides over those defaults. Ensure changing the configured default at runtime affects subsequent requests.
- `packages/server/src/config/config.ts` defines `AppConfig` through Zod and combines defaults, file config, env, and option overrides. `packages/server/src/config/file-loader.ts:32-42` persists config by merging an update into `config.json`; preserve unrelated settings when saving LLM settings.
- Keep `features/settings` focused on agent/session provider instances. LLM connections have their own feature/service/API at `features/llm-providers` and `/api/llm-providers`.
- Product decisions: support multiple named LLM connections, including several connections with the same provider type; each connection has multiple user-entered `modelIds` (no model catalog picker); users choose a registered provider type and configure its provider-specific fields; provider type metadata includes field labels/types and secret markers for the UI. One configured default connection/model. Secret values are persisted but never returned by API responses. Existing OpenAI-compatible settings remain loadable.
- Provider definitions include UI-safe config field descriptors; provider config itself is validated by that definition's Zod schema. Validate API request/response shapes with Zod in the LLM feature model and derive types. Frontend server state consumes Hono RPC types from `@repo/contracts`.
- Read `packages/server/AGENTS.md` before implementation. It requires service-level logic, Zod schemas, injected runtime dependencies, and backend tests. Keep the LLM settings separate from provider-instance CRUD semantics where their data/lifecycle differ.

## Tasks

- [x] 1. Define config schemas for multiple LLM connections and the default connection/model, retaining compatibility with current defaults/environment behavior where appropriate.
  - verify: `pnpm --filter @repo/server exec vitest run src/config/config.test.ts` covers default parsing, multiple same-type connections, and legacy/default config behavior.
  - files: `packages/server/src/config/config.ts`, `packages/server/src/config/config.test.ts`
- [x] 2. Register all configured LLM clients during container creation using the existing provider definitions and user-supplied model IDs.
  - verify: `pnpm --filter @repo/server exec vitest run src/container.test.ts` proves two clients of the same provider type have independent config and models.
  - files: `packages/server/src/container.ts`, `packages/server/src/container.test.ts`
- [x] 3. Add a dedicated LLM provider feature with type-aware Zod validation and connection CRUD/default operations; persist before changing runtime state and generically redact secret fields.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/llm-providers/service.test.ts` covers typed CRUD, config persistence, secret redaction, and default validation.
  - files: `packages/server/src/features/llm-providers/`
- [x] 4. Expose typed LLM settings routes and verify API responses never contain stored API key values.
  - verify: focused LLM provider integration tests exercise list/create/update/delete/default endpoints and assert response JSON excludes secret values.
  - files: `packages/server/src/features/llm-providers/controller.ts`, `packages/server/src/server.ts`, `packages/server/src/features/llm-providers/controller.integration.test.ts`
- [x] 5. Reconcile runtime clients and defaults after successful config writes, and ensure Cloudy requests use the current default unless a request explicitly specifies a model.
  - verify: `pnpm --filter @repo/server exec vitest run src/providers/cloudy/cloudy.adapter.test.ts src/lib/llm-provider/create-llm.test.ts` covers default changes, explicit overrides, and connection removal/update behavior.
  - files: `packages/server/src/lib/llm-provider/create-llm.ts`, `packages/server/src/lib/llm-provider/create-llm.test.ts`, `packages/server/src/providers/cloudy/cloudy.adapter.ts`, `packages/server/src/providers/cloudy/cloudy.adapter.test.ts`, `packages/server/src/container.ts`
- [x] 6. Run backend validation for the full settings/config/runtime change.
  - verify: `pnpm --filter @repo/server test && pnpm --filter @repo/server lint && pnpm --filter @repo/server check-types` passes.
  - files: —

## Done when

- [x] Users can configure multiple LLM connections, select among registered provider types, and define multiple model IDs for each connection.
- [x] LLM connections and the selected default connection/model persist in Cloudy's config and are registered in runtime on startup.
- [x] Dedicated LLM provider API exposes registered type/config metadata and manages connections/default; secret config values are never returned.
- [x] Successful updates take effect for subsequent LLM calls without restarting Cloudy; calls without explicit model settings use the configured default.
- [x] Backend tests, lint, and typecheck pass.

## Notes for implementer

- Do not implement or duplicate LLM provider definitions/registry; reuse `createLLM()` and registered provider types.
- Persist config before mutating runtime. If persistence fails, keep the current runtime registration and settings intact.
- Do not add a database migration; the agreed settings are file-backed in Cloudy's config.
- Follow repository guidance: ESM, type-only imports, no comments unless asked, and no commits unless explicitly requested.
