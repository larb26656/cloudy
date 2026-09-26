---
title: Secure browser extension context boundary: API
slug: secure-browser-extension-context-boundary-api
id: 20260921-secure-browser-extension-context-boundary-api
status: ready
created: 2026-09-21
source: planning session 2026-09-21
---

# Plan: Secure browser extension context boundary: API

## Why

The browser extension currently calls the generic OpenCode proxy and supplies its own directory and agent values, so its least-privilege browser assistant policy exists only in client code. Add a server-owned browser-chat boundary that always uses the registered browser workspace and the `browser` agent, and exposes only the session operations the side panel needs. This removes client control over OpenCode paths, directories, agents, and tool policy.

## Target files

| Path                                                                         | Action |
| ---------------------------------------------------------------------------- | ------ |
| `packages/server/src/features/browser-chat/model.ts`                         | create |
| `packages/server/src/features/browser-chat/browser-chat.service.ts`          | create |
| `packages/server/src/features/browser-chat/browser-chat.controller.ts`       | create |
| `packages/server/src/features/browser-chat/index.ts`                         | create |
| `packages/server/src/features/browser-chat/browser-chat.integration.test.ts` | create |
| `packages/server/src/container.ts`                                           | edit   |
| `packages/server/src/server.ts`                                              | edit   |
| `packages/contracts/src/index.ts`                                            | edit   |

## Context the new session needs

- `apps/browser-extension/entrypoints/sidepanel/lib/opencode/client.ts:9-14` creates an OpenCode SDK client against `/oc` and injects `X-OpenCode-Directory`; this header must not exist in the replacement browser API contract.
- `apps/browser-extension/entrypoints/sidepanel/lib/opencode/sessions.ts:13-89` identifies the required operations: create/list sessions, load messages, prompt, abort, and global event streaming. Preserve the UI's streaming capability when designing the replacement transport.
- The browser workspace is created and resolved by `packages/server/src/features/browser-workspace/browser-workspace.service.ts:24-69`; it is a normal workspace but browser-chat must use only its stored `directory` and the constant `browser` agent.
- `packages/server/src/features/browser-workspace/browser-workspace.templates.ts:12-35` disables all browser-agent tools. The service, not the caller, must select this agent and must reject requests when the browser workspace has not been initialized.
- `packages/server/src/features/proxy/proxy.service.ts:15-48` is a raw OpenCode forwarder. Reuse an internal OpenCode client/transport only if it cannot reintroduce caller-selected paths, headers, directories, or agents.
- Follow `packages/server/AGENTS.md`: define request and response schemas in `model.ts`, derive types with Zod, keep HTTP handling in the controller, and test the Hono surface with `createTestApp`.

## Tasks

- [ ] 1. **Define the minimal browser-chat schemas and routes for workspace status, session lifecycle, prompt submission, abort, and streaming events without directory or agent inputs.**
  - verify: `pnpm --filter @repo/server check-types`
  - files: `packages/server/src/features/browser-chat/model.ts`, `packages/server/src/features/browser-chat/browser-chat.controller.ts`
- [ ] 2. **Implement a browser-chat service that resolves the initialized browser workspace server-side and fixes every upstream request to its directory and the `browser` agent.**
  - verify: `pnpm --filter @repo/server exec vitest run src/features/browser-chat/browser-chat.integration.test.ts`
  - files: `packages/server/src/features/browser-chat/browser-chat.service.ts`, `packages/server/src/features/browser-chat/browser-chat.integration.test.ts`
- [ ] 3. **Expose only the allowlisted routes through a feature controller and wire the service into the application container and typed contract.**
  - verify: `pnpm --filter @repo/server check-types`
  - files: `packages/server/src/features/browser-chat/browser-chat.controller.ts`, `packages/server/src/features/browser-chat/index.ts`, `packages/server/src/container.ts`, `packages/server/src/server.ts`, `packages/contracts/src/index.ts`
- [ ] 4. **Test that forged directory, agent, and arbitrary OpenCode path inputs are absent from the contract and cannot affect the upstream request.**
  - verify: `pnpm --filter @repo/server exec vitest run src/features/browser-chat/browser-chat.integration.test.ts`
  - files: `packages/server/src/features/browser-chat/browser-chat.integration.test.ts`

## Done when

- [ ] Browser-chat clients can create, resume, prompt, abort, and receive events for browser sessions without submitting a directory or agent.
- [ ] Every upstream browser-chat request uses the directory from `browser-workspace` and agent `browser`, verified by integration tests.
- [ ] Requests before browser workspace initialization fail with an explicit client-safe error.
- [ ] `pnpm --filter @repo/server test`, `pnpm --filter @repo/server lint`, and `pnpm --filter @repo/server check-types` exit successfully.

## Notes for implementer

- Execute this after the proxy CORS plan and before deleting extension use of `/oc`.
- Do not make browser-chat a transparent proxy or add a pass-through `path`, arbitrary header, directory, agent, or tool field for future flexibility.
