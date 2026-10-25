---
title: Extensible Notification Provider Dispatch Core
slug: notification-provider-dispatch-core
id: 20261025-notification-provider-dispatch-core
status: ready
created: 2026-10-25
source: planning session 2026-10-25
---

# Plan: Extensible Notification Provider Dispatch Core

## Why

Cloudy needs a server-side notification dispatcher that features and automation actions can call without knowing provider transport details. Implement the first Discord webhook provider and persisted destination profiles behind a provider contract so future providers can add their own configuration, validation, and sending behavior without changing the dispatcher. Persist dispatch outcomes for troubleshooting without retrying failed sends or storing message contents in logs.

## Target file

| Path                                                          | Action                                                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `packages/server/src/db/schema/notification-profiles.ts`      | create — saved provider destinations                                                                   |
| `packages/server/src/db/schema/notification-delivery-logs.ts` | create — delivery outcomes without message contents                                                    |
| `packages/server/src/db/schema/index.ts`                      | edit — export tables                                                                                   |
| `packages/server/drizzle/`                                    | create — generated migration                                                                           |
| `packages/server/src/features/notification-providers/`        | create — provider contract, registry, Discord adapter, profile and dispatch services/controllers/tests |
| `packages/server/src/container.ts`                            | edit — construct and expose notification services                                                      |
| `packages/server/src/server.ts`                               | edit — mount notification provider routes                                                              |
| `packages/contracts/src/index.ts`                             | edit — type re-exports for web-app RPC                                                                 |

## Context the new session needs

- This plan is the backend foundation. Implement it before `20261025-notification-provider-profiles-ui.md` and `20261025-notification-automation-action.md`.
- The existing `packages/server/src/db/schema/notifications.ts:1-22` stores the in-app notification feed; do not repurpose it for outbound delivery history. Add a distinct delivery-log table. Re-export schema from `packages/server/src/db/schema/index.ts` and run `pnpm --filter @repo/server db:generate`; the generated SQL must ship with the server.
- Follow `packages/server/AGENTS.md`: Zod schemas and inferred types in models, Drizzle-only repositories, domain services, Hono controller routes, manual DI in `container.ts`, and route mounting in `server.ts`. Relevant existing feature structure is `packages/server/src/features/notifications/` and the automation feature.
- `packages/server/src/features/automations/automations.service.ts:31-35` shows factory-injected services; `packages/server/src/container.ts` is the canonical construction point. The dispatcher must be callable as a service from future feature code and from the Automation service; provider HTTP details stay in adapters.
- Profile contract: one profile represents one provider plus one destination. The initial provider is `discord`, configured by a Discord webhook URL. The profile API must never return provider secrets. Update semantics should allow a profile to be edited without returning its stored webhook URL (an omitted/blank secret keeps the current value; explicitly supplied replacement updates it). Keep credential values out of logs and error messages.
- Provider extensibility contract: each provider has a stable provider id, display metadata, provider-owned config validation, and a send operation accepting the shared plain-text message input. Registry lookup is by provider id; unknown ids are rejected. Do not put Discord payload formatting or webhook HTTP calls in the generic dispatcher.
- Dispatch accepts one or more profile ids and a plain-text message. Attempt each selected destination independently, continue after one failure, do not retry, and return per-profile outcomes. Provide a test-send operation using a fixed safe sample message so the UI can verify profile configuration.
- Persist one delivery log per attempted profile with profile id, provider id, outcome, timestamp, and sanitized error summary on failure. Do not persist message body or credentials. Treat provider failure as a recorded outcome rather than aborting remaining destinations.
- Expose a provider catalog containing only safe metadata needed by the UI. Credential fields and validation remain provider-specific; do not serialize secrets in catalog/profile DTOs.

## Tasks

- [ ] 1. Define profile and delivery-log tables, export them, and generate the migration.
  - verify: `pnpm --filter @repo/server db:generate && pnpm --filter @repo/server check-types` succeeds and generated SQL contains both tables.
  - files: `packages/server/src/db/schema/notification-profiles.ts`, `packages/server/src/db/schema/notification-delivery-logs.ts`, `packages/server/src/db/schema/index.ts`, `packages/server/drizzle/`
- [ ] 2. Define provider, profile, dispatch, test-send, and DTO Zod contracts; implement the provider registry and Discord webhook adapter.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/notification-providers` passes provider contract tests, including registry lookup, Discord request payload, invalid config, and sanitized provider errors.
  - files: `packages/server/src/features/notification-providers/`
- [ ] 3. Implement profile and delivery-log persistence plus dispatcher orchestration, recording independent success/failure outcomes without retries or message bodies.
  - verify: focused repository/service tests prove each attempted profile creates one safe log entry, a failed destination does not prevent later destinations, and no retry occurs.
  - files: `packages/server/src/features/notification-providers/`
- [ ] 4. Expose typed profile CRUD, provider catalog, test-send, and dispatch API; wire services into container/server and re-export contracts.
  - verify: `pnpm --filter @repo/server exec vitest run src/features/notification-providers` passes integration tests; profile/list responses never contain webhook URL and test-send records a delivery outcome.
  - files: `packages/server/src/features/notification-providers/`, `packages/server/src/container.ts`, `packages/server/src/server.ts`, `packages/contracts/src/index.ts`
- [ ] 5. Run backend and workspace quality gates.
  - verify: `pnpm --filter @repo/server test && pnpm --filter @repo/server lint && pnpm --filter @repo/server check-types && pnpm run lint && pnpm run check-types` passes.
  - files: —

## Done when

- [ ] A Discord profile can be created, listed, updated, deleted, and test-sent through the typed API without exposing its webhook URL.
- [ ] The dispatcher sends plain text through a provider registry and continues independent delivery attempts after a provider failure, with no retries.
- [ ] Each attempted destination gets a persistent outcome log containing no message body or provider secret.
- [ ] A future provider can be added by implementing/registering its own config validation and send operation without changing dispatcher control flow.
- [ ] Backend tests, lint, and type checks pass.

## Notes for implementer

- Read `packages/server/AGENTS.md` before implementation. Keep domain services framework-independent and use Zod-derived request/response types.
- Ensure log error summaries are sanitized; never serialize raw webhook URLs, request headers, or provider response bodies that could contain secrets.
- Update this plan's checkboxes as tasks are completed.
