---
title: Provider Template Instances with Runtime Registration
slug: provider-template-instances-runtime-registration
id: 20261013-provider-template-instances-runtime-registration
status: ready
created: 2026-10-13
source: planning session 2026-10-13
---

# Plan: Provider Template Instances with Runtime Registration

## Why

Cloudy currently configures one OpenCode provider profile at startup, while the provider
registry is built once and the Settings UI edits only that single profile. Users need to
register multiple connections from the same provider implementation (for example, multiple
OpenCode servers), configure each instance independently, and have changes take effect
immediately without restarting Cloudy. Failed connections must not discard saved settings;
the instance remains registered and reports its connection error so the user can correct
the endpoint or retry later.

## Target file

| Path                                                                                | Action                                                                             |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `packages/server/src/config/config.ts`                                              | edit — define provider instance config and legacy config normalization             |
| `packages/server/src/config/config.test.ts`                                         | edit — test defaults and legacy OpenCode config compatibility                      |
| `packages/server/src/providers/provider.registry.ts`                                | edit — add runtime registration/update/removal and instance lookup                 |
| `packages/server/src/providers/provider.registry.test.ts`                           | edit — test mutable registry behavior and stable IDs                               |
| `packages/server/src/providers/provider.event-hub.ts`                               | edit — dynamically subscribe/unsubscribe when registry instances change            |
| `packages/server/src/providers/provider.event-hub.test.ts`                          | edit — test dynamic upstream subscription lifecycle and downstream fan-out         |
| `packages/server/src/providers/opencode/opencode.adapter.ts`                        | edit — accept a configured instance ID instead of hard-coding `opencode`           |
| `packages/server/src/providers/index.ts`                                            | edit — export provider-template/runtime registry APIs                              |
| `packages/server/src/container.ts`                                                  | edit — construct templates, instances, registry, event hub, and settings service   |
| `packages/server/src/features/settings/model.ts`                                    | edit — validate provider instance settings and mutations with Zod                  |
| `packages/server/src/features/settings/service.ts`                                  | edit — persist instance changes and reconcile runtime immediately                  |
| `packages/server/src/features/settings/controller.ts`                               | edit — expose list/create/update/delete instance routes                            |
| `packages/server/src/features/settings/*.test.ts`                                   | edit — cover settings persistence and runtime reconciliation                       |
| `packages/server/src/features/settings/index.ts`                                    | edit — wire/export updated settings service/controller                             |
| `packages/server/src/config/file-loader.ts`                                         | edit — persist provider instance configuration while preserving unrelated settings |
| `apps/web-app/src/features/settings/components/ProviderSettings.tsx`                | edit — display and manage multiple registered provider instances                   |
| `apps/web-app/src/hooks/queries/useProviderSettings.ts`                             | edit — query/mutate instance-oriented settings API                                 |
| `apps/web-app/src/features/settings/components/ProviderSettings.component.test.tsx` | create — exercise list/add/edit/enable/disable/remove and connection error states  |
| `packages/server/src/features/settings/*.integration.test.ts`                       | edit/create — verify settings API and immediate runtime behavior                   |

## Context the new session needs

- `packages/server/src/config/config.ts:9-19,63-102` currently defines `providers.opencode`
  as one `{ enabled, baseUrl }` profile. `loadConfig()` also merges the legacy
  `opencodeApiBase` setting. Preserve compatibility by normalizing the old shape to one
  stable OpenCode instance instead of silently dropping existing user configuration.
- `packages/server/src/container.ts:50-72` constructs the proxy, static provider registry,
  settings service, sessions service, and event hub. This is the composition root; keep
  runtime dependencies injected here and avoid module-level singletons.
- `packages/server/src/providers/provider.registry.ts:23-60` currently builds a fixed map
  from adapters and rejects duplicate IDs. Its public methods dispatch operations by
  `providerId`. Extend this boundary to mutable instances; all provider API/session IDs
  refer to the **instance ID**, not the template ID.
- `packages/server/src/providers/opencode/opencode.adapter.ts:56-64` accepts a `baseUrl`
  but currently returns `id: "opencode"`. Multiple OpenCode instances require the adapter
  to receive a unique configured instance ID while retaining OpenCode-specific behavior.
- `packages/server/src/providers/provider.event-hub.ts:31-85,113-173` owns a central event
  producer and fans events out to downstream SSE subscribers. Its current producer creates
  upstream subscriptions from `registry.list()` when it starts; dynamic registration must
  add/remove upstream subscriptions without replacing the hub, closing downstream clients,
  or creating one upstream subscription per browser request. Keep connection state events
  scoped by instance ID.
- `packages/server/src/features/settings/service.ts:6-20` writes config through
  `updateFileConfig()` and currently returns `restartRequired: true`. New mutations must
  persist first, then reconcile runtime; if persistence fails, leave runtime untouched. If
  the endpoint is unavailable after persistence, retain the saved instance/config and
  report a disconnected/error status rather than rolling back.
- `packages/server/src/features/settings/model.ts:3-11` currently validates one OpenCode
  settings object. Keep request/response schemas in Zod and derive types from schemas per
  `packages/server/AGENTS.md`.
- `apps/web-app/src/features/settings/components/ProviderSettings.tsx:14-59` currently edits
  one enabled/baseUrl pair and shows a restart notice. Replace this with an instance list
  and create/edit interactions; the UI should present connection state and error details
  returned by Cloudy.
- `apps/web-app/AGENTS.md` requires React Query for server state, type-only imports, and
  shared `LoadingState`/`ErrorState`/`EmptyState` components. Read
  `apps/web-app/DESIGN.md` before making UI changes and run the design lint if design tokens
  are modified.
- `packages/server/AGENTS.md` requires Zod schemas, service-level domain logic, ESM imports,
  and relevant tests. For frontend changes, run the web-app lint/typecheck and tests; for
  backend changes, run server tests and typecheck. Root guidance requests `pnpm run lint`
  and `pnpm run check-types` before completion.
- Existing plans describe the boundaries this work builds on: `docs/plan/20260927-build-backend-provider-registry.md`,
  `docs/plan/20260927-support-multiple-agent-providers-ui.md`, and
  `docs/plan/20261003-run-opencode-subscription-in-backend.md`. Inspect their completed
  implementation and current code before changing behavior; do not re-implement their
  provider-neutral API, UI provider selection, or central event fan-out.
- Product decisions: provider templates are implementations (initially `opencode`); users
  register provider instances from templates; a template may have multiple instances; an
  instance has a stable ID, display name, enabled state, and template-specific config such
  as `baseUrl`; save/register/update/remove applies at runtime without server restart; failed
  connectivity does not undo persisted config; removing an instance does not delete its
  historical sessions, which remain associated with the removed instance ID.
- Template support is compile-time only: backend templates are statically registered, and
  the frontend maps each supported `templateId` to a dedicated config form. Do not add plugin
  loading or a generic form-metadata renderer in this scope. The Settings API exposes the
  supported template catalog so the UI can label/select registered templates.
- This is intentionally a broad cross-package feature. Keep the server-side API/runtime
  changes and frontend Settings changes in ordered, independently verifiable tasks; do not
  expand scope into adding another provider template or redesigning chat provider selection.

## Tasks

- [x] 1. Define provider-instance config schemas and normalize legacy OpenCode settings to a stable default instance ID.
  - verify: `pnpm --filter @repo/server exec vitest run src/config/config.test.ts` passes for both legacy and new config shapes.
  - files: `packages/server/src/config/config.ts`, `packages/server/src/config/config.test.ts`, `packages/server/src/config/file-loader.ts`
- [x] 2. Introduce a provider-template registry/factory that validates template-specific config and creates an adapter with the configured instance ID.
  - verify: `pnpm --filter @repo/server check-types` passes and focused tests create two OpenCode adapters with distinct IDs and base URLs.
  - files: `packages/server/src/providers/`, `packages/server/src/providers/opencode/opencode.adapter.ts`, `packages/server/src/providers/index.ts`
- [x] 3. Make the runtime ProviderRegistry mutable while preserving its existing provider operation API and stable instance IDs.
  - verify: `pnpm --filter @repo/server exec vitest run src/providers/provider.registry.test.ts` covers add, update, disable/remove, duplicate IDs, unknown IDs, and unchanged IDs for updates.
  - files: `packages/server/src/providers/provider.registry.ts`, `packages/server/src/providers/provider.registry.test.ts`
- [ ] 4. Update the central ProviderEventHub to reconcile upstream subscriptions as instances are registered, updated, enabled/disabled, or removed.
  - verify: `pnpm --filter @repo/server exec vitest run src/providers/provider.event-hub.test.ts` proves added instances emit events, removed/disabled instances stop emitting, and existing downstream subscribers remain open throughout reconfiguration.
  - files: `packages/server/src/providers/provider.event-hub.ts`, `packages/server/src/providers/provider.event-hub.test.ts`
- [ ] 5. Update the settings schemas, service, and routes to persist mutations before changing runtime state and return instance connection status.
  - verify: focused settings tests prove failed config persistence does not mutate runtime, unavailable endpoints retain saved settings and report error, and successful changes require no restart.
  - files: `packages/server/src/features/settings/model.ts`, `packages/server/src/features/settings/service.ts`, `packages/server/src/features/settings/controller.ts`, `packages/server/src/features/settings/index.ts`, `packages/server/src/features/settings/`, `packages/server/src/container.ts`
- [ ] 6. Add backend integration coverage for managing multiple instances through the Settings API and using their distinct provider IDs through the existing provider API.
  - verify: `pnpm --filter @repo/server test` passes, including integration assertions for two OpenCode instances and retained historical sessions after instance removal.
  - files: `packages/server/src/features/settings/`, `packages/server/src/features/providers/providers.integration.test.ts`, `packages/server/src/container.ts`
- [ ] 7. Update Provider Settings queries and UI to list and manage instances, including per-instance connection state and failure details.
  - verify: `pnpm --filter web-app exec vitest run src/features/settings/components/ProviderSettings.component.test.tsx` covers empty/list/create/edit/enable/disable/remove/error states.
  - files: `apps/web-app/src/features/settings/components/ProviderSettings.tsx`, `apps/web-app/src/hooks/queries/useProviderSettings.ts`, `apps/web-app/src/features/settings/components/ProviderSettings.component.test.tsx`
- [ ] 8. Run complete relevant validation and manually verify live reconfiguration without restarting the server.
  - verify: `pnpm run lint && pnpm run check-types && pnpm --filter @repo/server test && pnpm --filter web-app exec vitest run` passes; manually add two OpenCode endpoints, change one endpoint, disable/remove an instance, and confirm existing SSE clients remain connected.
  - files: —

## Done when

- [ ] Provider template identity is distinct from registered provider instance identity throughout config, API, registry, events, and UI.
- [ ] Multiple OpenCode instances can be configured simultaneously with unique IDs and independent endpoint URLs.
- [ ] Adding, editing, enabling/disabling, or removing an instance takes effect immediately without restarting Cloudy.
- [ ] The central event hub adjusts upstream provider subscriptions dynamically while preserving downstream SSE subscribers.
- [ ] Settings are persisted before runtime reconciliation; failed persistence leaves runtime unchanged.
- [ ] Unreachable endpoint configuration remains saved and registered with a visible connection error.
- [ ] Removing an instance does not delete its historical sessions or rewrite their provider IDs.
- [ ] Legacy `providers.opencode`/`opencodeApiBase` config continues to load as the default OpenCode instance.
- [x] Supported provider templates are compile-time registered and their Settings forms are selected through a frontend registry.
- [ ] Server and frontend tests, lint, and typechecks pass.

## Notes for implementer

- Preserve the existing settings route conventions in `packages/server/src/features/settings/controller.ts` when introducing instance mutation endpoints.
- Do not add dynamic plugin loading or a second provider implementation in this scope. The initial template registry only needs to support the existing OpenCode adapter and internal Echo adapter behavior.
- Keep the provider-neutral API and OpenCode SDK types behind the server adapter boundary; do not add SDK imports to the web-app.
- Do not create one upstream subscription per SSE/browser request. The Event Hub remains the shared upstream owner and must close only the subscription belonging to a removed/updated instance.
- Keep config writes atomic/consistent with the current `updateFileConfig()` behavior. A runtime connection failure is not a config-save failure.
- Do not add database migrations unless implementation proves they are necessary; current provider configuration is file-backed.
- Follow repository guidance not to commit changes unless explicitly requested.
