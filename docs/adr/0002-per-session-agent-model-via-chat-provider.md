---
id: 0002-per-session-agent-model-via-chat-provider
title: Use ChatProvider context for per-session agent/model selection
status: accepted
date: 2026-08-02
deciders: cloudy team
---

# ADR 0002: Per-Session Agent/Model State via ChatProvider

## Status

Accepted on 2026-08-02.

## Context

Currently agent and model selection lives in two global Zustand stores with localStorage persistence:
- `useDefaultAgentStore` → `"default-agent"`
- `useDefaultModelStore` → `"default-model"`

These are truly global — selecting an agent/model in any chat tab affects every tab and every session. There's no way to have different agents/models per session.

The user wants:
1. Per-session agent/model overrides (if I pick "claude" in session A, session B should still use my global default)
2. A Settings UI to configure the global defaults (so new sessions or "Use Default" have something sensible)
3. Clean component architecture — avoid prop drilling through 4+ levels

The constraints:
- `sessionId` lives in `tab.data` (from `tabStore` → `ChatContent` receives it as `tab.data.sessionId`)
- `AgentSelector` and `ModelSelector` are nested ~4 levels deep inside `ChatInput` → would need major prop drilling
- `ChatContainer` already receives `sessionId` as a prop and wraps the entire chat UI
- Existing hooks `useAgents()` and `useModels()` fetch available agents/models from the opencode backend

## Decision

We adopt a **ChatProvider context pattern** wrapping the chat UI inside `ChatContainer`:

```
ChatContainer(sessionId)
  └── ChatProvider(sessionId)
        ├── MessageList
        ├── ChatInput
        │     ├── AgentSelector  ← useChat() → effectiveAgent + setAgent
        │     └── ModelSelector  ← useChat() → effectiveModel + setModel
        └── SessionStatusBar
```

The `ChatProvider` computes `effectiveAgent` and `effectiveModel` using this precedence:
1. **Session-specific override** — stored in `sessionAgentModelStore` (localStorage key `"session-agent-model"`, keyed by `sessionId`)
2. **Global default** — from `useDefaultAgentStore` / `useDefaultModelStore`
3. **null** — if neither is set

When a user selects "Use Default Agent" / "Use Default Model" in the dropdown, the session-specific entry is cleared, causing the context to fall back to the global default.

A new **Settings → Agent & Model** page provides dropdowns populated by `useAgents()` / `useModels()` to configure the global defaults.

## Consequences

- **Positive:**
  - Agent/model selection is truly per-session with global defaults as fallback
  - Settings UI allows configuring global defaults explicitly
  - Clean component API: `useChat()` hook in AgentSelector/ModelSelector, no props needed
  - State persists across app restarts via localStorage

- **Negative:**
  - New architectural pattern (Context) — contributors need to understand the provider hierarchy
  - localStorage grows with session-specific selections — cleaned up only when user explicitly picks "Use Default"

- **Neutral:**
  - `sessionAgentModelStore` is keyed by `sessionId` — orphaned entries remain if server-side session is deleted (harmless stale data)
  - `ChatProvider` is created inside `ChatContainer`, not exposed to consumers — ownership is internal

## Alternatives Considered

- **Props drilling** — rejected: `sessionId`, `effectiveAgent`, `effectiveModel`, `setAgent`, `setModel` would need to pass through 4+ component layers (ChatContainer → ChatInput → AgentSelector/ModelSelector)

- **Global stores with session-keyed entries, no context** — rejected: the fallback logic (session → global → null) would need to be duplicated in every consumer; context centralizes this cleanly

- **Zustand store only, no ChatProvider** — rejected: deeply nested components like `AgentSelector` would need complex selector functions or would re-render on every store change

## Related

- Implementation plan: `plans/20260802-per-session-agent-model-chat-provider.md`
- Existing global stores: `src/stores/defaultAgentStore.ts`, `src/stores/defaultModelStore.ts`
- Settings architecture: `src/features/settings/settingsConfig.ts`
