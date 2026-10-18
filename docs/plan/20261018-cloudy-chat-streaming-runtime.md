---
title: Stream Cloudy Chat Through the LLM Runtime
slug: cloudy-chat-streaming-runtime
id: 20261018-cloudy-chat-streaming-runtime
status: ready
created: 2026-10-18
source: planning session 2026-10-18
---

# Plan: Stream Cloudy Chat Through the LLM Runtime

## Why

Cloudy's adapter currently sends only the newest user message to the LLM using `chat()`, then simulates streaming by splitting the completed answer into chunks. This prevents multi-turn context, real token streaming, and reliable cancellation or run-state reporting. Use the configured LLM connection/model, persisted session history, and normalized provider events to run one default Cloudy chat agent end to end.

## Target file

| Path                                                            | Action                                                                                                            |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `packages/server/src/lib/llm-provider/types.ts`                 | edit — define conversation input and optional abort signal for streaming                                          |
| `packages/server/src/lib/llm-provider/providers/openai.ts`      | edit — map conversation turns to OpenAI-compatible messages and stream actual deltas                              |
| `packages/server/src/lib/llm-provider/providers/openai.test.ts` | create — cover request mapping, stream deltas, and abort/error propagation                                        |
| `packages/server/src/providers/cloudy/cloudy.adapter.ts`        | edit — assemble conversation history, persist/run the streamed turn, and emit normalized lifecycle/message events |
| `packages/server/src/providers/cloudy/cloudy.adapter.test.ts`   | edit — cover multi-turn stream, run completion/failure, and abort                                                 |

## Context the new session needs

- This plan depends on `docs/plan/20261018-cloudy-chat-session-persistence.md`: use its SQLite-backed message repository for prior turns and new user/assistant messages. The adapter must not reconstruct conversation context from an in-memory array.
- `packages/server/src/lib/llm-provider/types.ts:4-16` currently defines `ChatInput` as `{ model, message }`, and `LLMProviderAdapter.chatAsync()` yields `{ text }`. Extend this boundary in a provider-neutral way to carry ordered role/content messages and an `AbortSignal`; retain `chat()` only if another caller still needs it.
- `packages/server/src/lib/llm-provider/providers/openai.ts:21-53` sends exactly one user message in both `chat()` and `chatAsync()`. Map supported conversation roles to OpenAI-compatible chat-completion roles and yield actual streamed deltas from the SDK.
- `packages/server/src/providers/cloudy/cloudy.adapter.ts:125-175,223-255` currently creates placeholder messages, awaits a non-streaming completion, then launches a fake `streamEcho()` loop. Replace this flow with a background run that calls `chatAsync()`, writes message updates through the persistence repository, and publishes normalized events with `providerId: "cloudy"` (not `"echo"`).
- The normalized event vocabulary is in `packages/ai-core/src/event.ts:23-49,63-78`; emit `session.status`, `message.updated`, `message.delta`, `message.part.updated`, and `run.failed` with the existing provider-agnostic shapes. The session service already applies provider events to persisted session status/run status.
- `ProviderAdapter.abortSession()` is part of the contract at `packages/ai-core/src/provider.ts:101-106`; `sessionsService.abort()` delegates to it at `packages/server/src/features/sessions/sessions.service.ts:274-277`. Use per-session `AbortController`s and remove them when runs settle.
- Default provider/model selection is being established by `docs/plan/20261018-configure-llm-provider-connections-backend.md`. Complete that plan first; do not reintroduce hard-coded DeepInfra defaults or conflict with its runtime reconfiguration work. Preserve an explicit message model override when provided, otherwise use the current configured default.
- MVP decision: one default Cloudy agent, no tool calls, workspace/file actions, multi-agent delegation, or agent-profile selector. Keep message history and stream/run lifecycle as the focus.
- Tests are Vitest unit tests in this package. Follow `packages/server/AGENTS.md`: strict TypeScript, ESM/type-only imports, domain errors in services, and no comments unless asked.

## Tasks

- [ ] 1. Extend the LLM provider types to accept ordered conversation messages and a cancellation signal for streaming.
  - verify: `pnpm --filter @repo/server check-types` passes and `create-llm.test.ts` covers the new `chatAsync` input contract.
  - files: `packages/server/src/lib/llm-provider/types.ts`, `packages/server/src/lib/llm-provider/create-llm.test.ts`
- [ ] 2. Update the OpenAI-compatible adapter to send every conversation turn and yield real streamed deltas, honoring cancellation.
  - verify: `pnpm --filter @repo/server exec vitest run src/lib/llm-provider/providers/openai.test.ts` asserts the SDK receives user/assistant history in order and streamed chunks are yielded; abort and provider errors propagate.
  - files: `packages/server/src/lib/llm-provider/providers/openai.ts`, `packages/server/src/lib/llm-provider/providers/openai.test.ts`
- [ ] 3. Replace the Cloudy fake-stream path with a persistent multi-turn run that streams provider events and final message updates.
  - verify: `pnpm --filter @repo/server exec vitest run src/providers/cloudy/cloudy.adapter.test.ts` proves the second turn receives prior persisted turns, emits actual deltas with `providerId: "cloudy"`, and persists the completed assistant message.
  - files: `packages/server/src/providers/cloudy/cloudy.adapter.ts`, `packages/server/src/providers/cloudy/cloudy.adapter.test.ts`
- [ ] 4. Implement run status/error cleanup and session abort handling for active streamed runs.
  - verify: focused Cloudy adapter tests assert running → completed, failed runs emit `run.failed` and settle to failed/idle state, abort stops further deltas and clears the active controller.
  - files: `packages/server/src/providers/cloudy/cloudy.adapter.ts`, `packages/server/src/providers/cloudy/cloudy.adapter.test.ts`
- [ ] 5. Run server validation for the LLM runtime change.
  - verify: `pnpm --filter @repo/server test && pnpm --filter @repo/server lint && pnpm --filter @repo/server check-types` passes.
  - files: —

## Done when

- [ ] A Cloudy request without explicit model selection uses the current configured LLM connection/model; explicit model overrides continue to work.
- [ ] Each user turn is sent with the prior persisted conversation history, and assistant output is streamed from the provider rather than simulated after completion.
- [ ] Cloudy publishes correctly scoped normalized events, persists the final message, and updates run status on success and failure.
- [ ] Aborting a Cloudy session cancels its active LLM stream and no further deltas are emitted for that run.
- [ ] Server tests, lint, and typecheck pass.

## Notes for implementer

- Implement this after the message persistence plan and coordinate `cloudy.adapter.ts` edits with `docs/plan/20261018-configure-llm-provider-connections-backend.md`.
- Keep the LLM abstraction provider-neutral; do not import OpenAI SDK types into `types.ts` or the Cloudy adapter.
- Do not implement tool calling, file/workspace actions, multi-agent behavior, or selectable Cloudy agent profiles in this MVP.
- Follow `packages/server/AGENTS.md`: ESM, type-only imports, and no comments unless asked.
