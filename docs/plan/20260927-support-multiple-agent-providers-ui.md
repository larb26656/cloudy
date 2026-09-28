---
title: Support Multiple Agent Providers in UI
slug: support-multiple-agent-providers-ui
id: 20260927-support-multiple-agent-providers-ui
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Support Multiple Agent Providers in UI

## Why

Cloudy needs to support multiple agent providers such as OpenCode and Codex without making users manage provider-specific chats manually or mixing incompatible agent/model catalogs. The UI should make the execution provider explicit at the chat-session level while keeping agent and model selection scoped to that provider. Advanced users should be able to continue work with another provider and later compose providers in Desk workflows.

## Target file

| Path                                                                       | Action                                                                         |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `apps/web-app/src/features/home/tabs/implementations/chat/meta.ts`         | edit — include provider context in chat tab identity/title metadata            |
| `apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx` | edit — preserve provider-scoped session context                                |
| `apps/web-app/src/components/chat/AgentSelector.tsx`                       | edit — render provider-scoped agent options                                    |
| `apps/web-app/src/components/chat/ModelSelector.tsx`                       | edit — render provider-scoped model options                                    |
| `apps/web-app/src/components/chat/ChatHeaderActions.tsx`                   | edit/create — add provider selector and continue-with-provider action          |
| `apps/web-app/src/features/chat/components/CreateChatDialog.tsx`           | edit — choose provider when creating a chat                                    |
| `apps/web-app/src/features/settings/components/AgentModelSettings.tsx`     | edit — expose provider configuration/defaults without mixing catalogs          |
| `apps/web-app/src/features/home/components/SessionRow.tsx`                 | edit — show the provider badge in session history                              |
| `apps/web-app/src/features/desk/`                                          | follow-up — support explicit multi-provider workflow nodes after chat UX ships |

## Context the new session needs

- The app is a tabbed desktop UI. Chat tabs are registered in `apps/web-app/src/features/home/tabs/template/registry.ts`, and their persisted data is migrated by `apps/web-app/src/stores/tabStore.ts`. Any new provider field on chat tab data requires a persistence migration and must not break existing tabs.
- Existing agent/model selection is session-scoped. Read `apps/web-app/src/components/chat/AgentSelector.tsx`, `ModelSelector.tsx`, `ChatContainer.tsx`, and the session override design in `docs/plan/20260802-per-session-agent-model-chat-provider.md` before changing selector behavior.
- The provider abstraction is backend-owned. The UI must consume the normalized provider catalog and provider API, not OpenCode or Codex SDK types. The relevant prerequisites are `docs/plan/20260927-build-backend-provider-registry.md`, `docs/plan/20260927-migrate-frontend-model-catalog-to-provider-api.md`, and `docs/plan/20260927-migrate-frontend-chat-to-provider-api.md`.
- Use the domain vocabulary `providerId`, `agentId`/agent name, `modelId`, and canonical `sessionId`. Do not reintroduce provider-specific field names such as `providerID` or expose SDK objects in React components. See `packages/ai-core/src/provider.ts` and `packages/ai-core/src/model.ts`.
- Product decision: one chat session has one execution provider. Changing provider is an explicit `Continue with another provider` action that creates or forks a new provider session after previewing the transferable context: summary, relevant files, git diff, current task, and unresolved questions.
- Product decision: provider is not the same thing as agent or model. The header hierarchy is `[Provider] [Agent] [Model]`; changing provider refreshes the available agent/model catalogs and must not silently retain incompatible selections.
- Product decision: Chat is the simple surface for one provider; Desk is the advanced surface for explicit workflows such as `OpenCode: Analyze -> Codex: Implement -> OpenCode: Review`. Do not introduce multi-provider orchestration into the normal chat flow in this phase.
- Existing frontend conventions in `apps/web-app/AGENTS.md` apply: server state belongs in TanStack Query, Zustand uses individual selectors, type-only imports are required, and shared loading/error/empty states use the existing state components.

## Tasks

- [x] 1. Add provider identity to chat tab creation, persistence, title, and migration behavior while keeping legacy chat tabs valid
  - verify: `pnpm --filter web-app check-types` passes and a persisted legacy chat tab is migrated to the default provider without losing its session or directory
  - files: `apps/web-app/src/features/home/tabs/implementations/chat/meta.ts`, `apps/web-app/src/features/home/tabs/implementations/chat/ChatContent.tsx`, `apps/web-app/src/stores/tabStore.ts`
- [x] 2. Add provider selection to the New Chat flow and persist the selected provider on the created chat session
  - verify: the component test creates chats for two providers and asserts that each resulting tab stores the selected `providerId`
  - files: `apps/web-app/src/features/chat/components/CreateChatDialog.tsx`, `apps/web-app/src/features/home/tabs/implementations/chat/meta.ts`
- [x] 3. Make agent and model selectors provider-scoped and reset incompatible selections when the provider changes
  - verify: selector tests show only the active provider's catalog and clear an agent/model that is unavailable under the newly selected provider
  - files: `apps/web-app/src/components/chat/AgentSelector.tsx`, `apps/web-app/src/components/chat/ModelSelector.tsx`, `apps/web-app/src/components/chat/ChatContainer.tsx`
- [x] 4. Add the chat-header provider control and explicit Continue with another provider flow with transferable-context preview
  - verify: component tests assert that provider switching does not mutate the current session and that confirmation creates a new session request with summary, files, diff, task, and unresolved questions
  - files: `apps/web-app/src/components/chat/ChatHeaderActions.tsx`, `apps/web-app/src/components/chat/`, `apps/web-app/src/lib/cloudy/provider.ts`
- [x] 5. Show provider identity in tab titles and session history without making provider badges the only identifier
  - verify: Storybook or component tests render provider name/badge for OpenCode and Codex and remain readable on narrow layouts
  - files: `apps/web-app/src/features/home/tabs/implementations/chat/meta.ts`, `apps/web-app/src/features/home/components/SessionRow.tsx`
- [x] 6. Add provider-aware defaults and connection/configuration states to Agent & Model settings
  - verify: settings tests render separate provider sections, distinguish connected/unconfigured providers, and never mix agent/model options between providers
  - files: `apps/web-app/src/features/settings/components/AgentModelSettings.tsx`, `apps/web-app/src/features/settings/settingsConfig.ts`
- [ ] 7. Run frontend validation and manually verify the core provider flows
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run` passes; manual test opens two tabs with different providers, switches between them, reloads, and continues one session with another provider
  - files: —

## Done when

- [ ] Every chat session visibly and persistently identifies exactly one execution provider.
- [ ] Agent and model selectors only show catalogs belonging to the active provider.
- [ ] Changing provider is explicit and never silently changes or mutates the current session.
- [ ] Continue with another provider previews and transfers context into a new provider session.
- [ ] Existing chat tabs migrate safely and retain their session, directory, agent, and model state where compatible.
- [ ] Provider identity is visible in chat tabs and session history on desktop and mobile layouts.
- [ ] Frontend lint, typecheck, and tests pass.

## Notes for implementer

- Implement the backend provider registry and normalized provider API plans first; this UI plan must not add direct OpenCode/Codex SDK imports.
- Do not implement multi-provider Desk orchestration in this phase. Keep it as a follow-up plan after the single-provider chat UX is stable.
- Do not make provider selection a global setting. Global defaults may exist, but the effective provider belongs to each chat session.
- Follow the repository rule to avoid comments unless needed, use ESM/type-only imports, and do not commit as part of implementation.
