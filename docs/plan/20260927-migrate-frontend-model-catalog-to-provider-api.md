---
title: Migrate Frontend Model Catalog to Provider API
slug: migrate-frontend-model-catalog-to-provider-api
id: 20260927-migrate-frontend-model-catalog-to-provider-api
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Migrate Frontend Model Catalog to Provider API

## Why

The frontend currently calls `oc.config.providers()` directly and converts OpenCode SDK
models into hand-written `ModelProvider` and `ModelConfig` types. After the backend provider
registry exists, the browser should consume the Cloudy provider API and the canonical
`@repo/ai-core` model contracts instead of knowing OpenCode field names.

## Target file

| Path                                                                   | Action                                                         |
| ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| `apps/web-app/src/hooks/queries/useModels.ts`                          | edit — query Cloudy provider catalog via Hono RPC              |
| `apps/web-app/src/types/models.ts`                                     | delete — remove duplicate model/provider types                 |
| `apps/web-app/src/types/index.ts`                                      | edit — remove deleted exports and use contracts where needed   |
| `apps/web-app/src/lib/cloudy/query-keys.ts`                            | edit — add provider query keys if not already present          |
| `apps/web-app/src/features/settings/components/AgentModelSettings.tsx` | edit — consume normalized model fields                         |
| `apps/web-app/src/stores/favoriteModelsStore.ts`                       | edit — migrate `ModelConfig` references to `ModelInfo`         |
| `apps/web-app/src/hooks/queries/useModels.test.ts`                     | create/edit — test the Cloudy API query mapping/error behavior |

## Context the new session needs

- `apps/web-app/src/hooks/queries/useModels.ts:10-41` currently calls `getOcClient()` and
  maps `providerID`, `modelID`, `m.limit.context`, and `m.capabilities.toolcall`. Replace
  this entire SDK query with the typed `cloudyClient` provider route created by the backend
  plan.
- `apps/web-app/src/types/models.ts:3-18` duplicates the model vocabulary already available
  from `@repo/contracts` via `@repo/ai-core`. Delete it instead of adding compatibility
  aliases; the migration is specifically intended to remove duplicate frontend contracts.
- `apps/web-app/src/features/settings/components/AgentModelSettings.tsx:20-110` currently
  expects `provider.id`, `provider.name`, `provider.models`, and OpenCode-style model IDs.
  Keep its UI behavior but use `providerId`/`modelId` from normalized `ModelInfo`.
- `apps/web-app/src/stores/favoriteModelsStore.ts` persists favorite model references. Preserve
  the persisted `{ providerId, modelId }` identity semantics and do not change its storage key
  or version unless the actual persisted shape changes.
- `apps/web-app/src/lib/api.ts` is the typed Hono client boundary. Use a type-only
  `@repo/contracts` import for `AppType`; do not add runtime imports from contracts.
- Follow `apps/web-app/AGENTS.md`: server state belongs in TanStack Query, use individual
  Zustand selectors, and do not reintroduce OpenCode SDK types into frontend model code.

## Tasks

- [x] 1. Add provider catalog query keys and switch `useModels` to the Cloudy API
  - verify: `pnpm --filter web-app exec vitest run src/hooks/queries/useModels.test.ts`
  - files: `apps/web-app/src/hooks/queries/useModels.ts`, `apps/web-app/src/lib/cloudy/query-keys.ts`, `apps/web-app/src/hooks/queries/useModels.test.ts`
- [x] 2. Replace frontend model/provider types with `ModelInfo` and `ProviderInfo` from contracts
  - verify: `pnpm --filter web-app check-types` and no imports of `@/types/models` remain
  - files: `apps/web-app/src/types/models.ts`, `apps/web-app/src/types/index.ts`, `apps/web-app/src/stores/favoriteModelsStore.ts`, `apps/web-app/src/features/settings/components/AgentModelSettings.tsx`
- [x] 3. Verify catalog UI and stale-model behavior
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run`
  - files: —

## Done when

- [x] `useModels` makes no OpenCode SDK calls and reads from the Cloudy provider API.
- [x] Frontend model identity uses `providerId` and `modelId` consistently.
- [x] `apps/web-app/src/types/models.ts` is removed and no duplicate provider/model interfaces remain.
- [x] Favorite models still distinguish models by provider and model ID.
- [x] Frontend lint, typecheck, and relevant tests pass.

## Notes for implementer

- This plan depends on `20260927-build-backend-provider-registry.md` being implemented first.
- Do not migrate sessions, messages, events, approvals, or questions here; those belong to the
  following chat/session migration plan.
- Keep the existing OpenCode client for those remaining consumers until the next plan removes it.

## Implementation notes (2026-09-27)

- Deleting `types/models.ts` rippled beyond the target list: `defaultModelStore`, `tabStore`
  (v10 → v11), `flowStore` (v2 → v3), `ChatProvider`, `ChatContainer`, `BotChatContainer`,
  `ModelSelector`, desk chat nodes, chat/bot-chat tab `meta.tsx`, `lib/command.ts`,
  `lib/commands/types.ts`, and the model fixtures in component tests all carried `ModelConfig`
  and now use `ModelInfo` from `@repo/contracts`.
- `src/lib/models.ts` adds `toModelInfo`, the shared legacy-shape normalizer used by the
  store migrations (persisted `providerID`/`modelID` → `providerId`/`modelId`).
- `@repo/ui`'s `ModelSelectorModel` still uses `providerID`/`modelID` (shared with the
  browser extension, out of scope here); web-app `ModelSelector.tsx` adapts via
  `toSelectorModel`/`fromSelectorModel`.
- `useSessions.ts`/`useMessages.ts` were concurrently rewritten by the follow-up chat
  migration session to call the provider API directly; their local `ModelConfig` shims were
  reconciled to `ModelInfo`. The 65 currently failing tests in
  permission/question/global-event files belong to that session's in-flight work, not this
  migration (verified by reverting only those files).
