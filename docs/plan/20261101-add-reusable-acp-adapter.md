---
title: Add reusable ACP adapter
slug: add-reusable-acp-adapter
id: 20261101-add-reusable-acp-adapter
status: ready
created: 2026-11-01
source: planning session 2026-11-01
---

# Plan: Add reusable ACP adapter

## Why

Cloudy currently connects to OpenCode through an HTTP SDK, while OMP and other agents can expose ACP over a child process's stdio. A reusable server-side ACP adapter should use the official ACP SDK directly so each agent can supply a launch specification without Cloudy reimplementing protocol or adding an unnecessary transport abstraction.

## Target file

| Path                                                    | Action |
| ------------------------------------------------------- | ------ |
| `packages/server/src/providers/acp/acp.adapter.ts`      | create |
| `packages/server/src/providers/acp/acp.adapter.test.ts` | create |

## Context the new session needs

- OMP's ACP guide: https://omp.sh/docs/acp — its later provider definition will supply command `omp` and args `["acp"]`; the generic adapter must not hardcode either. ACP uses newline-delimited JSON-RPC on stdin/stdout, with diagnostics on stderr and absolute workspace paths in session lifecycle requests. Do not connect to an HTTP port or parse normal TUI output.
- ACP v1 reference: https://agentclientprotocol.com/protocol/v1/overview.md and https://agentclientprotocol.com/protocol/v1/session-setup.md. Negotiate `initialize` before `session/new`; only call optional methods when advertised. Check the exact supported version/capabilities against a locally installed `omp` during implementation rather than assuming every optional method is available.
- Use the official TypeScript `@agentclientprotocol/sdk` client API documented at https://agentclientprotocol.com/libraries/typescript.md, especially its `client(...)`, `ndJsonStream(...)` and `connectWith(...)` example at https://github.com/agentclientprotocol/typescript-sdk/blob/main/src/examples/client.ts. The example itself calls Node's `spawn(...)`; the SDK handles protocol framing/dispatch, not launching or owning the child process. Add the dependency to `packages/server/package.json` and update the lockfile in the implementation session. This plan's file map covers the adapter and its test; dependency installation is a prerequisite.
- `packages/server/src/providers/opencode/opencode.adapter.ts:67` illustrates the `AgentProviderAdapter` boundary; `packages/ai-core/src/provider.ts:98` defines the contract. Implement only the operations the initial ACP slice can support truthfully. OMP-specific setup later supplies a launch profile and any genuinely OMP-specific behavior. `packages/server/src/container.ts:97` constructs adapters; do not register OMP in this slice.
- `packages/server/src/providers/provider.event-hub.ts:128` maintains long-lived event subscriptions; the ACP adapter will need a queue that works independently of individual HTTP requests. A provider registry change can restart event subscriptions (`provider.event-hub.ts:73`), so closing a subscription must not accidentally kill active ACP sessions.
- Follow `packages/server/AGENTS.md`: strict TypeScript, ESM, no module-level singleton, tests adjacent to source. Avoid shell-interpolated commands; spawn an executable with an argument array. A missing binary, a crashed process, malformed protocol output, or a timeout must reject pending operations and release process resources. Do not handwrite JSON-RPC framing, dispatch, or a second transport class.

## Tasks

- [x] 1. **Expose a testable ACP adapter factory that accepts a typed executable/args launch specification, spawns the agent, initializes the SDK client, and creates sessions with an absolute `cwd`.**
  - verify: `pnpm --filter @repo/server check-types` passes after installing the official ACP SDK dependency.
  - files: `packages/server/src/providers/acp/acp.adapter.ts`
- [x] 2. **Map prompt updates and cancellation to minimal Cloudy events and implement permission replies plus child-process cleanup without wrapping the SDK in another protocol layer.**
  - verify: `pnpm --filter @repo/server check-types` passes; stdout goes only to the SDK stream and stderr is never parsed as ACP.
  - files: `packages/server/src/providers/acp/acp.adapter.ts`
- [x] 3. **Test initialization, session cwd, streamed updates, pending permission responses, cancellation, process death, and cleanup using a fake agent process.**
  - verify: `pnpm --filter @repo/server exec vitest run src/providers/acp/acp.adapter.test.ts` passes.
  - files: `packages/server/src/providers/acp/acp.adapter.test.ts`

## Done when

- [x] `pnpm --filter @repo/server exec vitest run src/providers/acp/acp.adapter.test.ts` passes with two distinct fake agent launch specs, proving there are no OMP-specific assumptions.
- [x] `pnpm run lint && pnpm run check-types` passes.
- [x] When OMP is installed locally, a smoke test using the launch spec `{ command: "omp", args: ["acp"] }` confirms `initialize` and `session/new`; otherwise report that the integration smoke test awaits the OMP profile stage.

## Notes for implementer

- Keep credentials owned by each ACP agent's own environment; do not require OMP-specific auth in the generic adapter.
- Client-side filesystem, terminal, MCP, and approval capabilities are separate integration work; advertise only client capabilities that Cloudy actually implements. In the initial integration, rely on OMP's documented local fallbacks where available and keep permissions fail-closed.
- Follow-up plans should separately cover: durable message/session history and fuller ACP-to-`@repo/ai-core` mapping; an OMP launch profile (`omp acp`); provider configuration/registration; then provider settings UI and end-to-end checks. Session/list/load/resume/close and model/mode controls should be negotiated from each agent's actual ACP capabilities rather than assumed from OMP.
