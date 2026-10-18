---
title: Configure LLM Provider Connections UI
slug: configure-llm-provider-connections-ui
id: 20261018-configure-llm-provider-connections-ui
status: completed
created: 2026-10-18
source: planning session 2026-10-18
---

# Plan: Configure LLM Provider Connections UI

## Why

Cloudy's Settings UI currently manages provider instances used for external chat/session backends, while the LLM registry used by Cloudy's own LLM calls is configured through hard-coded/env settings. Add a dedicated Settings experience for configuring multiple LLM connections and choosing the default connection/model. Reuse the backend's existing LLM provider registry and the typed Cloudy API; do not add provider SDK details to the browser.

## Target file

| Path                                                                                   | Action                                                                                         |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `apps/web-app/src/features/settings/settingsConfig.ts`                                 | edit — register the LLM settings section/route if a separate settings section is needed        |
| `apps/web-app/src/routes/settings/`                                                    | edit/create — add or wire the LLM settings route following existing settings route conventions |
| `apps/web-app/src/features/settings/components/LLMProviderSettings.tsx`                | create — render connection list, create/edit/remove controls, and default selection            |
| `apps/web-app/src/hooks/queries/useLLMProviderSettings.ts`                             | create — typed React Query queries and mutations for the backend LLM settings API              |
| `apps/web-app/src/lib/cloudy/query-keys.ts`                                            | edit — add query keys for LLM settings if required by current key structure                    |
| `apps/web-app/src/features/settings/components/LLMProviderSettings.component.test.tsx` | create — cover settings form and connection management states                                  |

## Context the new session needs

- This plan depends on `docs/plan/20261018-configure-llm-provider-connections-backend.md`, which defines the API contract. Implement the backend plan first and use its inferred Hono RPC response/request types rather than inventing frontend DTOs.
- `apps/web-app/src/features/settings/settingsConfig.ts` currently registers Providers, Agent & Model, Appearance, and Quick Phrases. `apps/web-app/src/features/settings/components/ProviderSettings.tsx` is for provider-template instances such as OpenCode connections; do not repurpose it for LLM API connections because those have a different lifecycle and purpose.
- `apps/web-app/src/hooks/queries/useProviderSettings.ts` shows the current typed Cloudy API + React Query mutation pattern. Follow it for LLM settings and invalidate the relevant settings query after mutations.
- The existing provider config form registry under `apps/web-app/src/features/settings/components/provider-config/` is for the OpenCode adapter. The initial LLM provider implementation is OpenAI-compatible, so the LLM form needs fields for connection name, API key, optional base URL, and multiple user-entered model IDs per connection. Render provider types from the backend-supported type list rather than hard-coding provider SDKs in the web app.
- Secret behavior is agreed: API keys are stored in Cloudy's config file, but list/read API responses only indicate whether a key is configured. Never prefill or display the stored key. For an existing connection, an empty key field means retain the current key; a newly entered key replaces it.
- The backend type catalog is the source of provider choices and provider-specific config form fields. Multiple connections of the same type and multiple model IDs per connection are supported. The user chooses one connection/model as the default. Model IDs are typed by the user, not selected from a fetched model catalog.
- Use TanStack Query for API state, individual Zustand selectors only if client-only state is needed, shared `LoadingState`/`ErrorState`/`EmptyState` components, and type-only imports. Read `apps/web-app/DESIGN.md` before UI implementation and follow `apps/web-app/AGENTS.md`.

## Tasks

- [x] 1. Add a dedicated settings route/navigation entry for LLM provider connections, keeping the existing Providers section for session-provider instances.
  - verify: `pnpm --filter web-app check-types` passes and navigating to the new settings route renders the LLM settings screen.
  - files: `apps/web-app/src/features/settings/settingsConfig.ts`, `apps/web-app/src/routes/settings/`
- [x] 2. Add React Query hooks for the separate LLM providers API, including registered type metadata and connection/default mutations.
  - verify: `pnpm --filter web-app exec vitest run src/features/settings/components/LLMProviderSettings.component.test.tsx` verifies the hooks send the expected requests and invalidate settings queries after mutations.
  - files: `apps/web-app/src/hooks/queries/useLLMProviderSettings.ts`, `apps/web-app/src/lib/cloudy/query-keys.ts`
- [x] 3. Build the connection management UI for multiple same-type connections with name, provider type, optional base URL, secret API key input, and manual model ID input.
  - verify: `pnpm --filter web-app exec vitest run src/features/settings/components/LLMProviderSettings.component.test.tsx` covers empty/list/create/edit/remove, validation, and mutation error/success states.
  - files: `apps/web-app/src/features/settings/components/LLMProviderSettings.tsx`, `apps/web-app/src/features/settings/components/LLMProviderSettings.component.test.tsx`
- [x] 4. Add default connection/model selection and safe API key editing behavior.
  - verify: component tests confirm the selected default is displayed and saved, an existing key is never shown, and saving a connection without entering a replacement key preserves the existing secret.
  - files: `apps/web-app/src/features/settings/components/LLMProviderSettings.tsx`, `apps/web-app/src/features/settings/components/LLMProviderSettings.component.test.tsx`, `apps/web-app/src/hooks/queries/useLLMProviderSettings.ts`
- [x] 5. Run frontend validation and verify settings/API behavior with focused tests and production build.
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run` passes; manually create two connections of the same type, set the default, edit/remove a connection, and confirm masked-key behavior.
  - files: —

## Done when

- [x] Settings exposes a dedicated LLM connections UI without changing the meaning of the existing Providers screen.
- [x] Users can choose a registered provider type, fill its type-specific config fields, and manage multiple model IDs per connection.
- [x] Users can select the default connection/model for LLM calls.
- [x] Stored API keys are never rendered or returned to the browser; users can replace a key by entering a new value.
- [x] Frontend lint, typecheck, and focused component test pass.

## Notes for implementer

- Implement after the backend plan so the UI can rely on its final typed API contract.
- Do not add OpenAI SDK imports or other provider runtime integrations to the frontend.
- Read `apps/web-app/DESIGN.md` before implementation. Do not modify design tokens unless necessary; if changed, update DESIGN.md and run `pnpm --filter web-app design:lint`.
- Follow the web-app checklist: `pnpm --filter web-app lint`, `pnpm --filter web-app check-types`, and relevant Vitest tests. Do not commit unless explicitly requested.
