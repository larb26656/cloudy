---
title: Add reusable ACP client transport
slug: add-reusable-acp-client-transport
id: 20261101-add-reusable-acp-client-transport
status: ready
created: 2026-11-01
source: planning session 2026-11-01
---

# Plan: Add reusable ACP client transport

## Why

Cloudy currently connects to OpenCode through an HTTP SDK, while OMP and other agents can expose ACP over a child process's stdio. A reusable server-side ACP client transport is needed so each agent provider can supply a launch specification and provider-specific mapping without reimplementing protocol or process management.

## Target file

| Path | Action |
| --- | --- |
| `packages/server/src/providers/acp/acp.transport.ts` | create |
| `packages/server/src/providers/acp/acp.transport.test.ts` | create |

## Context the new session needs

- OMP's ACP guide: https://omp.sh/docs/acp — its later provider definition will supply command `omp` and args `["acp"]`; the generic transport must not hardcode either. ACP uses newline-delimited JSON-RPC on stdin/stdout, with diagnostics on stderr and absolute workspace paths in session lifecycle requests. Do not connect to an HTTP port or parse normal TUI output.
- ACP v1 reference: https://agentclientprotocol.com/protocol/v1/overview.md and https://agentclientprotocol.com/protocol/v1/session-setup.md. Negotiate `initialize` before `session/new`; only call optional methods when advertised. Check the exact supported version/capabilities against a locally installed `omp` during implementation rather than assuming every optional method is available.
- Prefer the official TypeScript `@agentclientprotocol/sdk` client API documented at https://agentclientprotocol.com/libraries/typescript.md; add the dependency to `packages/server/package.json` and update the lockfile in the implementation session if needed. This plan's file map covers the new transport and its test; dependency installation is a prerequisite, not a parallel implementation feature.
- `packages/server/src/providers/opencode/opencode.adapter.ts:67` illustrates the `AgentProviderAdapter` boundary. A later generic ACP adapter should consume this transport and perform common ACP-to-`@repo/ai-core` mapping; OMP-specific setup then supplies a launch profile and any genuinely OMP-specific behavior. `packages/server/src/container.ts:97` constructs adapters; do not register OMP in this slice.
- `packages/server/src/providers/provider.event-hub.ts:128` maintains long-lived event subscriptions; the eventual adapter will need a queue that works independently of individual HTTP requests. A provider registry change can restart event subscriptions (`provider.event-hub.ts:73`), so closing a subscription must not accidentally kill active OMP sessions.
- Follow `packages/server/AGENTS.md`: strict TypeScript, ESM, no module-level singleton, tests adjacent to source. Avoid shell-interpolated commands; spawn an executable with an argument array. A missing binary, a crashed process, malformed protocol output, or a timeout must reject pending operations and release process resources.

## Tasks

- [ ] 1. **Expose a testable transport factory that accepts a typed executable/args launch specification, initializes ACP, and creates/resumes sessions with an absolute `cwd`.**
  - verify: `pnpm --filter @repo/server check-types` passes after installing the official ACP SDK dependency.
  - files: `packages/server/src/providers/acp/acp.transport.ts`
- [ ] 2. **Add prompt, cancellation, update/permission callbacks, stderr isolation, and explicit shutdown with process-exit cleanup.**
  - verify: `pnpm --filter @repo/server check-types` passes; stdout is consumed only as protocol traffic and stderr is never parsed as ACP.
  - files: `packages/server/src/providers/acp/acp.transport.ts`
- [ ] 3. **Test initialization, session cwd, streamed updates, pending permission responses, cancellation, process death, and cleanup using a fake child process or injectable streams.**
  - verify: `pnpm --filter @repo/server exec vitest run src/providers/acp/acp.transport.test.ts` passes.
  - files: `packages/server/src/providers/acp/acp.transport.test.ts`

## Done when

- [ ] `pnpm --filter @repo/server exec vitest run src/providers/acp/acp.transport.test.ts` passes with two distinct fake agent launch specs, proving there are no OMP-specific assumptions.
- [ ] `pnpm run lint && pnpm run check-types` passes.
- [ ] When OMP is installed locally, a smoke test using the launch spec `{ command: "omp", args: ["acp"] }` confirms `initialize` and `session/new`; otherwise report that the integration smoke test awaits the OMP adapter stage.

## Notes for implementer

- Keep credentials owned by each ACP agent's own environment; do not require OMP-specific auth in this transport.
- Client-side filesystem, terminal, MCP, and approval capabilities are separate integration work; advertise only client capabilities that Cloudy actually implements. In the initial integration, rely on OMP's documented local fallbacks where available and keep permissions fail-closed.
- Follow-up plans should separately cover: a reusable ACP-to-`@repo/ai-core` adapter and message persistence; an OMP launch profile (`omp acp`); provider configuration/registration; then provider settings UI and end-to-end checks. Session/list/load/resume/close and model/mode controls should be negotiated from each agent's actual ACP capabilities rather than assumed from OMP.
