---
title: Complete Frontend OpenCode Removal
slug: complete-frontend-opencode-removal
id: 20260927-complete-frontend-opencode-removal
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Complete Frontend OpenCode Removal

## Why

The web app has partially moved sessions, messages, interactions, and model catalog access
behind Cloudy's provider API, but it still imports the OpenCode SDK, uses `src/lib/opencode`,
keeps `/oc` environment settings, and calls provider-specific endpoints for agents, files,
commands, and mention suggestions. Finish the migration so the browser depends only on
Cloudy's provider-neutral API/contracts and OpenCode remains an internal backend adapter.

This is an orchestration plan. The repository already contains focused plans for the backend
provider registry, model catalog, chat/session API, streaming types, and shared message UI;
execute those plans in dependency order, then complete the remaining frontend runtime cleanup.

## Target file

| Path                                                       | Action |
| ---------------------------------------------------------- | ------ |
| `docs/plan/20260927-complete-frontend-opencode-removal.md` | create |

## Context the new session needs

- `apps/web-app/package.json:28-30` still depends on `@opencode-ai/sdk` and `@repo/opencode`.
  They may be removed only after a repository-wide source and test search confirms no supported
  frontend import remains.
- `apps/web-app/src/hooks/queries/useModels.ts` and the current `useSessions.ts`/
  `useMessages.ts` already show the target direction: use `cloudyClient` or the normalized
  provider API while preserving existing React Query keys and UI-facing shapes.
- Direct SDK consumers still exist in `apps/web-app/src/hooks/queries/useAgents.ts`,
  `useFiles.ts`, `useCommand.ts`, and `src/components/chat/extensions/suggestion.ts`.
  These need provider routes and normalized contracts before deleting the browser client.
- `apps/web-app/src/providers/GlobalEventProvider.tsx:57` now points at the provider event
  route, but `handle-global-event.ts` and related tests still use OpenCode event vocabulary.
  Normalize events at the backend/provider boundary; do not expose SDK `GlobalEvent`, `Part`,
  `sessionID`, or `messageID` shapes to React components or stores.
- `apps/web-app/src/lib/opencode/oc-instance.ts` and `client.ts` are the remaining browser
  client boundary. Delete them only after all SDK call sites, SDK-only adapters, and tests are
  migrated. `getOcInstanceUrl` has no supported consumer in the current source search.
- Existing focused plans to execute first:
  - `docs/plan/20260927-create-provider-agnostic-ai-core-types.md`
  - `docs/plan/20260927-build-backend-provider-registry.md`
  - `docs/plan/20260927-migrate-frontend-model-catalog-to-provider-api.md`
  - `docs/plan/20260927-migrate-frontend-chat-to-provider-api.md`
  - `docs/plan/20260927-migrate-opencode-streaming-to-ai-core-types.md`
  - `docs/plan/20260927-remove-opencode-types-from-web-app.md`
  - `docs/plan/20260927-remove-opencode-types-from-ui-message.md`
- Follow `apps/web-app/AGENTS.md`: server state belongs in TanStack Query, use type-only
  contract imports, preserve the `CONNETED` literal unless every consumer is updated, and run
  frontend lint/typecheck/tests before finishing. Follow `packages/server/AGENTS.md` for Zod
  schemas, service error boundaries, and provider adapter ownership.

## Tasks

- [ ] 1. Implement the AI-core types and backend provider registry plans in dependency order.
  - verify: `pnpm --filter @repo/ai-core check-types && pnpm --filter @repo/server test`
  - files: `packages/ai-core/**`, `packages/server/src/providers/**`, `packages/server/src/features/providers/**`
- [ ] 2. Complete the model catalog and chat/session migration plans, including normalized SSE,
     permissions, questions, and query invalidation behavior.
  - verify: `pnpm --filter web-app exec vitest run src/hooks/queries src/providers src/components/permission src/components/question`
  - files: `apps/web-app/src/hooks/queries/**`, `apps/web-app/src/providers/**`, `apps/web-app/src/components/permission/**`, `apps/web-app/src/components/question/**`
- [ ] 3. Add provider-neutral routes/contracts for agents, files/VCS, commands, and file/command
     suggestions, then migrate their frontend consumers away from `getOcClient()`.
  - verify: `pnpm --filter @repo/server test && pnpm --filter web-app check-types`; search finds no `getOcClient` in `apps/web-app/src/hooks` or `apps/web-app/src/components`
  - files: `packages/server/src/providers/**`, `packages/server/src/features/providers/**`, `apps/web-app/src/hooks/queries/useAgents.ts`, `apps/web-app/src/hooks/queries/useFiles.ts`, `apps/web-app/src/hooks/queries/useCommand.ts`, `apps/web-app/src/components/chat/extensions/suggestion.ts`
- [ ] 4. Finish the OpenCode-type boundary migration in the web app, shared UI, tests, and
     Storybook fixtures without changing visible chat/file behavior.
  - verify: `pnpm --filter @repo/ui check-types && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run`
  - files: `apps/web-app/src/types/**`, `apps/web-app/src/lib/opencode/**`, `apps/web-app/src/**/*.test.ts*`, `apps/web-app/src/**/*.stories.tsx`, `packages/ui/src/components/message/**`
- [ ] 5. Remove the browser OpenCode client and obsolete `/oc` configuration after migration;
     replace any remaining env access with the Cloudy API origin and delete unused SDK/package
     references from manifests and lockfile.
  - verify: `pnpm install --lockfile-only` followed by `pnpm --filter web-app lint && pnpm --filter web-app check-types`; `rg -n '(@opencode-ai/sdk|@repo/opencode|VITE_OPENCODE_URL|VITE_OC_INSTANCE_URL|/api/oc|/oc/|getOcClient)' apps/web-app packages/ui/src` returns no supported runtime references
  - files: `apps/web-app/src/lib/opencode/oc-instance.ts`, `apps/web-app/src/lib/opencode/client.ts`, `apps/web-app/src/lib/opencode/index.ts`, `apps/web-app/src/config/env.ts`, `apps/web-app/.env`, `apps/web-app/.env.production`, `apps/web-app/package.json`, `pnpm-lock.yaml`
- [ ] 6. Remove or rename stale OpenCode-only docs and mocks, while retaining explicit backend
     adapter tests that intentionally cover the OpenCode integration.
  - verify: `rg -n 'OpenCode SDK|/oc/|VITE_OPENCODE_URL|VITE_OC_INSTANCE_URL' apps/web-app/src apps/web-app/AGENTS.md` returns no frontend runtime/config references
  - files: `apps/web-app/AGENTS.md`, `apps/web-app/src/**/*.stories.tsx`, `apps/web-app/src/**/*.test.ts*`
- [ ] 7. Run repository-wide validation and confirm the production bundle contains no frontend
     OpenCode SDK dependency or `/oc` API URL.
  - verify: `pnpm run lint && pnpm run check-types && pnpm --filter @repo/server test && pnpm --filter web-app test && pnpm --filter web-app build`
  - files: —

## Done when

- [ ] All browser API calls go through Cloudy's typed RPC/provider API; no frontend runtime code
      instantiates or imports the OpenCode SDK.
- [ ] OpenCode-specific types and field names are confined to backend/provider adapters and
      explicitly scoped integration tests.
- [ ] `@opencode-ai/sdk`, `@repo/opencode`, `VITE_OPENCODE_URL`, `VITE_OC_INSTANCE_URL`, and
      `/oc` are absent from supported web-app runtime/config code.
- [ ] Chat streaming, sessions, files, commands, agents, permissions, questions, model
      selection, Storybook mocks, and persisted UI behavior remain covered by passing tests.
- [ ] Repository lint, typecheck, backend tests, frontend tests, and web-app production build
      pass.

## Notes for implementer

- Do not delete `/api/oc` on the server until the browser and every supported client have no
  consumer; remove the legacy proxy as a separate backend cleanup only after the search is clean.
- Do not use `any` as a migration bridge. Add or extend a provider-neutral AI-core contract and
  convert provider payloads at the adapter boundary.
- The current worktree contains in-progress migration changes. Preserve unrelated user changes
  and reconcile with the focused plans instead of resetting files.
