---
title: Create Provider-Agnostic AI Core Types
slug: create-provider-agnostic-ai-core-types
id: 20260927-create-provider-agnostic-ai-core-types
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Create Provider-Agnostic AI Core Types

## Why

The chat UI and shared message components currently expose OpenCode SDK types such as `Session`, `Part`, `GlobalEvent`, and `PermissionRequest`. This makes a future backend/provider adapter leak into the frontend and forces every provider to mimic OpenCode's data model.

Create a dependency-free `@repo/ai-core` package as the source of truth for the provider-agnostic AI domain, then re-export the public types through `@repo/contracts` for browser consumers. This phase only establishes the type boundary; it does not migrate OpenCode hooks, streaming stores, or API routes yet.

## Target file

| Path                                  | Action                                                           |
| ------------------------------------- | ---------------------------------------------------------------- |
| `packages/ai-core/package.json`       | create — package metadata and scripts                            |
| `packages/ai-core/tsconfig.json`      | create — shared strict TypeScript configuration                  |
| `packages/ai-core/src/session.ts`     | create — canonical chat session and run status types             |
| `packages/ai-core/src/message.ts`     | create — canonical chat message and message part types           |
| `packages/ai-core/src/model.ts`       | create — model references and model capability types             |
| `packages/ai-core/src/agent.ts`       | create — provider-agnostic agent types                           |
| `packages/ai-core/src/event.ts`       | create — normalized chat event types                             |
| `packages/ai-core/src/interaction.ts` | create — input, attachment, approval, and question types         |
| `packages/ai-core/src/provider.ts`    | create — provider capabilities and provider-facing request types |
| `packages/ai-core/src/index.ts`       | create — package type barrel                                     |
| `packages/ai-core/src/*.test.ts`      | create — type-shape/runtime-free contract tests where useful     |
| `packages/contracts/package.json`     | edit — add the workspace dependency on `@repo/ai-core`           |
| `packages/contracts/src/index.ts`     | edit — type-only re-exports from `@repo/ai-core`                 |

This is one tightly coupled package-boundary change. It intentionally does not modify `packages/server` or `apps/web-app` behavior.

## Context the new session needs

- `packages/contracts/src/index.ts:1-40` is a type-only facade for browser consumers. Keep its exports type-only; importing runtime values would risk pulling Node dependencies into the browser bundle.
- `packages/contracts/package.json:20-22` currently depends only on `@repo/server`; add `@repo/ai-core` as a workspace dependency without adding provider SDK dependencies.
- The frontend currently defines partial generic-looking types in `apps/web-app/src/types/models.ts:3-18` and `apps/web-app/src/types/agent.ts:1-7`, but chat data still leaks OpenCode through `packages/ui/src/components/message/types.ts:1-29` and `packages/opencode/src/message-stream.ts:1-15`.
- Existing OpenCode event handling in `apps/web-app/src/lib/opencode/handle-global-event.ts:14-27` and `packages/opencode/src/streaming-store.ts:12-27` is the later migration target. The new event union must be expressive enough for session status, message updates/deltas, approval requests, questions, and failures, but must not import or copy OpenCode SDK types.
- The canonical message model should support the current UI use cases: text, reasoning, tool calls, files, diffs, subtasks, compaction, and an `unknown` fallback for provider-specific parts. Keep provider-specific raw payloads optional and isolated behind `unknown` rather than exposing SDK structures.
- Use generic naming and fields (`providerId`, `modelId`, `sessionId`, `createdAt`) instead of OpenCode naming (`providerID`, `sessionID`) in `ai-core`.
- `@repo/ai-core` must not depend on `@repo/server`, `@repo/contracts`, `@opencode-ai/sdk`, React, Hono, or Node runtime packages. It should contain types only unless a small runtime-free helper is demonstrably needed.
- Follow repo conventions from the root `AGENTS.md`: ESM, strict TypeScript, `import type`, ASCII by default, and no comments unless needed. `packages/server/AGENTS.md` Zod-first rules apply to future API models, not this domain-only type package.
- Do not replace existing frontend/OpenCode types in this phase. The package and re-exports must compile while all existing consumers remain unchanged.

## Tasks

- [x] 1. Scaffold `@repo/ai-core` with package metadata, strict tsconfig, source barrel, and lint/typecheck scripts matching the existing workspace package conventions
  - verify: `pnpm --filter @repo/ai-core check-types` and `pnpm --filter @repo/ai-core lint` both pass
  - files: `packages/ai-core/package.json`, `packages/ai-core/tsconfig.json`, `packages/ai-core/src/index.ts`
- [x] 2. Define canonical session, run status, model, and agent types without provider-specific field names
  - verify: `packages/ai-core/src/session.ts`, `model.ts`, and `agent.ts` compile without imports from OpenCode, Hono, React, or Node packages
  - files: `packages/ai-core/src/session.ts`, `packages/ai-core/src/model.ts`, `packages/ai-core/src/agent.ts`
- [x] 3. Define the discriminated `MessagePart` union and `ChatMessage` shape for the current message UI, including tool, reasoning, file, diff, subtask, compaction, and unknown parts
  - verify: add representative type-level fixtures or tests for every union member, then run `pnpm --filter @repo/ai-core check-types`
  - files: `packages/ai-core/src/message.ts`, `packages/ai-core/src/message.test.ts`
- [x] 4. Define normalized chat events and interaction types for send input, attachments, approvals, questions, and provider capabilities
  - verify: event and interaction fixtures cover message deltas, session status changes, approval requests, questions, and failures without referencing `GlobalEvent`, `PermissionRequest`, or `QuestionV2Request`
  - files: `packages/ai-core/src/event.ts`, `packages/ai-core/src/interaction.ts`, `packages/ai-core/src/provider.ts`, `packages/ai-core/src/event.test.ts`
- [x] 5. Export the complete public type surface from `@repo/ai-core` and expose it through the type-only `@repo/contracts` facade
  - verify: `pnpm install --lockfile-only` updates workspace resolution if required, then `pnpm --filter @repo/contracts check-types` passes and `packages/contracts/src/index.ts` contains only type exports
  - files: `packages/ai-core/src/index.ts`, `packages/contracts/package.json`, `packages/contracts/src/index.ts`
- [x] 6. Run the repository checks and confirm this phase did not change existing provider behavior
  - verify: `pnpm run lint && pnpm run check-types` passes; existing `pnpm --filter @repo/opencode test` remains green
  - files: —

## Done when

- [x] `@repo/ai-core` exists as a workspace package with no dependency on OpenCode, Hono, React, Node, server, or contracts packages.
- [x] The package exports canonical types for sessions, messages/parts, models, agents, normalized events, interactions, and provider capabilities.
- [x] `@repo/contracts` re-exports the AI core types using `export type` only, preserving its browser-safe boundary.
- [x] The message part union covers current UI requirements and has an explicit provider-specific `unknown` fallback.
- [x] `pnpm run lint && pnpm run check-types` passes without migrating current OpenCode consumers.

## Notes for implementer

- Do not add the `ChatProvider` service interface or provider adapter implementation in this plan. Those belong in a follow-up plan after the domain vocabulary is reviewed.
- Do not import or re-export OpenCode SDK aliases from `@repo/ai-core`, even as type-only imports.
- Prefer stable generic identifiers and timestamps. Preserve provider-specific data only as `unknown` or explicitly optional metadata.
- Keep the first version minimal. If a proposed type is only needed by OpenCode files, leave it for the adapter migration phase instead of widening the core package.
