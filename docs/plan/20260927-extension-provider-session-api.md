---
title: Migrate Extension Sessions to Provider API
slug: extension-provider-session-api
id: 20260927-extension-provider-session-api
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Migrate Extension Sessions to Provider API

## Why

The browser extension still creates an OpenCode SDK client and calls the legacy `/oc`
proxy for session listing, creation, and message loading. Move this read/session boundary
to Cloudy's normalized provider API so the extension no longer knows SDK response shapes or
provider-specific field names.

## Target file

| Path                                                                        | Action |
| --------------------------------------------------------------------------- | ------ |
| `apps/browser-extension/entrypoints/sidepanel/lib/cloudy/provider.ts`       | create |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/sessions.ts`     | edit   |
| `apps/browser-extension/entrypoints/sidepanel/hooks/useSessions.ts`         | edit   |
| `apps/browser-extension/entrypoints/sidepanel/hooks/useSessionMessages.ts`  | edit   |
| `apps/browser-extension/entrypoints/sidepanel/components/ModelSelector.tsx` | edit   |
| `apps/browser-extension/entrypoints/sidepanel/tests/opencode.test.ts`       | edit   |

## Context the new session needs

- `apps/web-app/src/lib/cloudy/provider.ts:3-82` is the reference for the provider API URL
  and request helpers. The extension must use `${cloudyApiUrl}/api/providers/opencode`, not
  `${cloudyApiUrl}/oc`.
- Routes and payload validation are defined in `packages/server/src/features/providers/providers.controller.ts`
  and `providers.model.ts`. Session list/detail/messages and catalog routes accept `directory`
  as a query/body field.
- Normalized models come from `@repo/ai-core`: `ChatSession` in `packages/ai-core/src/session.ts`,
  `ChatMessage`/`MessagePart` in `packages/ai-core/src/message.ts`, and provider catalog types
  in `packages/ai-core/src/model.ts`/`provider.ts`. Keep SDK conversion inside the server adapter.
- Preserve the extension-facing behavior currently in `lib/opencode/sessions.ts`: browser
  sessions use agent `browser`, directory is propagated, injected-context detection remains
  based on `INJECTED_CONTEXT_MARKER`, and all loaded message parts remain available to the UI.
- `ModelSelector.tsx` currently calls `config.providers()` through the SDK. Replace it with
  `GET /api/providers` and map normalized `providerId`/`modelId` to the shared UI selector
  shape without reconstructing SDK `status`, `family`, or `limit` fields.

## Tasks

- [x] 1. Add a small extension provider HTTP client with JSON/error handling and typed helpers for catalog, sessions, and messages.
  - verify: `pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/entrypoints/sidepanel/lib/cloudy/provider.ts`
- [x] 2. Replace SDK session/message/catalog calls with the provider client while preserving directory propagation and normalized UI models.
  - verify: `pnpm --dir apps/browser-extension exec vitest run entrypoints/sidepanel/tests/opencode.test.ts entrypoints/sidepanel/tests/hooks.test.tsx && pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/entrypoints/sidepanel/lib/opencode/sessions.ts`, `apps/browser-extension/entrypoints/sidepanel/hooks/useSessions.ts`, `apps/browser-extension/entrypoints/sidepanel/hooks/useSessionMessages.ts`, `apps/browser-extension/entrypoints/sidepanel/components/ModelSelector.tsx`
- [x] 3. Update fixtures and assertions to use provider-neutral sessions/messages and verify the legacy `/oc` path is absent from this read/session boundary.
  - verify: `! rg -n 'createClient|/oc|@opencode-ai/sdk' apps/browser-extension/entrypoints/sidepanel/lib/opencode/sessions.ts apps/browser-extension/entrypoints/sidepanel/components/ModelSelector.tsx`
  - files: `apps/browser-extension/entrypoints/sidepanel/tests/opencode.test.ts`

## Done when

- [x] Session listing, creation, message loading, and model catalog use `/api/providers/opencode` or `/api/providers`.
- [x] Components and hooks consume normalized extension models without importing the OpenCode SDK.
- [x] Directory propagation, browser agent selection, injected-context behavior, and all message parts remain covered by tests.

## Notes for implementer

- Keep HTTP calls in `lib/cloudy`/boundary modules, never in presentational components.
- Use type-only imports and do not use `any` as a migration bridge.
- Do not delete the SDK dependency until the event and action plans are complete.
