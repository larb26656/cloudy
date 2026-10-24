---
title: Persist agent avatar recipe
slug: persist-agent-avatar-recipe
id: 20261024-persist-agent-avatar-recipe
status: ready
created: 2026-10-24
source: planning session 2026-10-24
---

# Plan: Persist agent avatar recipe

## Why

An agent's chosen avatar currently exists only inside the UI builder and cannot be saved with the agent. Add a validated, optional avatar recipe to the settings API and `config.json` so existing agents remain compatible and a chosen appearance survives reloads.

## Target file

| Path                                                           | Action |
| -------------------------------------------------------------- | ------ |
| `packages/server/src/config/config.ts`                         | edit   |
| `packages/server/src/features/settings/model.ts`               | edit   |
| `packages/server/src/features/settings/agents/service.test.ts` | edit   |

## Context the new session needs

- `packages/server/src/config/config.ts:58` defines the file-backed `AgentConfigSchema`; it currently stores only `id`, `name`, and optional `systemPrompt`. Adding an optional `avatar` there makes `AppConfig.agents` preserve it through `updateFileConfig`.
- `packages/server/src/features/settings/model.ts:11` independently defines the HTTP `agentSchema`; `createAgentSchema` and `updateAgentSchema` are derived from it at lines 27–28. Keep the server's request/response contract in lockstep with the file config schema.
- `packages/server/src/features/settings/agents/service.ts:32` and `:50` already copy arbitrary validated agent fields into the next config array, so no service change should be necessary once both schemas include `avatar`.
- The browser recipe is `AgentAvatarRecipe` in `apps/web-app/src/components/agent-avatar/AgentAvatar.tsx:55`. Do not import this React module into the server. Recreate its finite shape/color/layer choices in Zod on the server, and keep `avatar` optional for existing config files and agents that have not chosen one.
- Server code uses ESM and type-only imports where applicable; do not add comments unless needed. The relevant validation command is `pnpm --filter @repo/server check-types`.

## Tasks

- [x] 1. **Add an optional avatar recipe to the file-backed agent configuration schema.**
  - verify: `pnpm --filter @repo/server check-types`
  - files: `packages/server/src/config/config.ts`
- [x] 2. **Expose the same optional avatar recipe through create, update, and list agent settings schemas.**
  - verify: `pnpm --filter @repo/server check-types`
  - files: `packages/server/src/features/settings/model.ts`
- [x] 3. **Confirm the generic agent service writes and returns a supplied avatar unchanged, then run its focused tests.**
  - verify: `pnpm --filter @repo/server exec vitest run src/features/settings/agents/service.test.ts`
  - files: `packages/server/src/features/settings/agents/service.test.ts`

## Done when

- [x] The create and update agent requests accept a complete avatar recipe and reject unknown option values.
- [x] An avatar supplied to the settings service is present in `config.json` and in the subsequent agent-list response.
- [x] Existing `config.json` files without `avatar` still load successfully.

## Notes for implementer

Keep the persisted object as the raw recipe (`shape`, `color`, `eyes`, `headwear`, `facewear`, `faceDecoration`, `ambient`), not SVG markup or asset paths. This keeps config portable and lets the React component own rendering.
