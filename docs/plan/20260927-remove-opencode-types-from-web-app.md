---
title: Remove OpenCode types from web app UI
slug: remove-opencode-types-from-web-app
id: 20260927-remove-opencode-types-from-web-app
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Remove OpenCode types from web app UI

## Why

The web-app still exposes OpenCode SDK types through hooks, stores, components, tests,
stories, and query data. This means UI-facing code remains coupled to the provider even
after streaming messages were normalized.

Introduce explicit web-app domain/view-model types and conversion functions at the
`src/lib/opencode` boundary. Migrate sessions, files, permissions, questions, message
helpers, and status consumers so SDK types remain only where the app calls or receives the
OpenCode API.

## Target files

| Path                                                   | Action                              |
| ------------------------------------------------------ | ----------------------------------- |
| `apps/web-app/src/lib/opencode/adapter.ts`             | create/edit                         |
| `apps/web-app/src/types/*.ts`                          | create/edit                         |
| `apps/web-app/src/hooks/queries/useSessions.ts`        | edit                                |
| `apps/web-app/src/hooks/queries/useMessages.ts`        | edit                                |
| `apps/web-app/src/hooks/queries/useFiles.ts`           | edit                                |
| `apps/web-app/src/hooks/queries/usePermissions.ts`     | edit                                |
| `apps/web-app/src/hooks/queries/useQuestions.ts`       | edit                                |
| `apps/web-app/src/components/**/*.tsx`                 | edit where SDK types cross UI props |
| `apps/web-app/src/features/**/*.tsx`                   | edit where SDK types cross UI props |
| `apps/web-app/src/stores/sessionErrorStore.ts`         | edit                                |
| `apps/web-app/src/lib/message/file-summarize.ts`       | edit                                |
| `apps/web-app/src/providers/GlobalEventProvider.tsx`   | edit boundary typing                |
| `apps/web-app/src/lib/opencode/handle-global-event.ts` | edit boundary typing                |
| `apps/web-app/src/**/*.test.ts*`                       | edit fixtures/types                 |
| `apps/web-app/src/**/*.stories.tsx`                    | edit fixtures/types                 |

## Context the new session needs

- `apps/web-app/src/lib/opencode/oc-instance.ts` and `src/lib/opencode/client.ts` are the
  integration boundary. SDK client calls may keep SDK request/response types internally,
  but exported helpers should return app/domain types where practical.
- `apps/web-app/src/hooks/queries/useSessions.ts` and `useMessages.ts` currently expose
  SDK-shaped query data to components. Convert at the hook boundary to `ChatSession` and
  the normalized/UI message model established by the preceding UI plan.
- `packages/ai-core/src/session.ts` defines `ChatSession`, `SessionStatus`, and `RunStatus`.
  `packages/ai-core/src/interaction.ts` defines approval/question request models, but it
  does not yet define file tree or VCS diff models; add narrowly scoped provider-neutral
  models if needed.
- `apps/web-app/src/lib/message/file-summarize.ts` currently consumes SDK `Part` directly;
  it should consume `MessagePart[]` and use normalized file/diff fields.
- `apps/web-app/src/stores/sessionErrorStore.ts` derives its type from SDK
  `AssistantMessage["error"]`. Replace it with an explicit app/AI-core session error
  model, preserving all fields rendered by `MessageError`.
- `GlobalEventProvider` and `handle-global-event.ts` necessarily receive raw SDK events;
  normalize immediately and prevent those types from crossing into React components or
  Zustand state.
- Migrate story/test fixtures as part of each domain so the source tree, not only the
  production build, is free of UI SDK imports.

## Tasks

- [x] 1. Define or extend provider-neutral web-app/AI-core models for sessions, status,
     file nodes/content/diffs, permissions, questions, and session errors based on actual UI usage.
  - verify: `pnpm --filter @repo/ai-core check-types && pnpm --filter web-app check-types`
  - files: `packages/ai-core/src/*.ts`, `apps/web-app/src/types/*.ts`
- [x] 2. Add OpenCode-to-domain conversion helpers and make query hooks return domain types
     while keeping SDK types internal to `src/lib/opencode` API calls.
  - verify: `pnpm --filter web-app check-types` and query hook tests pass
  - files: `apps/web-app/src/lib/opencode/adapter.ts`, `apps/web-app/src/hooks/queries/*.ts`
- [x] 3. Migrate session, status, permission, question, and file components to domain/view
     model props without changing visible behavior or query invalidation.
  - verify: `pnpm --filter web-app exec vitest run` for affected component tests
  - files: `apps/web-app/src/components/**/*.tsx`, `apps/web-app/src/features/**/*.tsx`, `apps/web-app/src/stores/sessionErrorStore.ts`
- [x] 4. Migrate message/file helpers, event provider boundary, stories, and test fixtures;
     keep raw SDK event conversion isolated in `src/lib/opencode`.
  - verify: `pnpm --filter web-app exec vitest run && pnpm --filter web-app check-types`
  - files: `apps/web-app/src/lib/message/file-summarize.ts`, `apps/web-app/src/providers/GlobalEventProvider.tsx`, `apps/web-app/src/lib/opencode/handle-global-event.ts`, `apps/web-app/src/**/*.test.ts*`, `apps/web-app/src/**/*.stories.tsx`
- [x] 5. Audit imports and remove any direct SDK type dependency from UI-facing files; retain
     SDK imports only in OpenCode clients/adapters and explicitly documented integration tests.
  - verify: `pnpm run lint && pnpm run check-types && ! grep -R 'from "@opencode-ai/sdk' apps/web-app/src/components apps/web-app/src/features apps/web-app/src/hooks apps/web-app/src/stores apps/web-app/src/types`
  - files: all listed web-app targets

## Done when

- [x] Web-app components, features, hooks, stores, types, stories, and tests do not import OpenCode SDK types directly.
- [x] SDK conversion is confined to `src/lib/opencode` integration code and raw SDK events do not enter UI state.
- [ ] `pnpm --filter web-app test`, `pnpm --filter web-app lint`, and `pnpm --filter web-app check-types` pass. Full test run remains blocked by existing Vitest/Storybook setup failures; message/file helper tests pass.

## Notes for implementer

- Preserve existing React Query keys, invalidation behavior, notification behavior, and
  `CONNETED` status literal; do not rename unrelated public values.
- Prefer individual Zustand selectors and keep server state in TanStack Query, per
  `apps/web-app/AGENTS.md`.
- Do not use `any` to bridge SDK/domain types. Add a conversion helper or an explicit
  normalized field instead.
