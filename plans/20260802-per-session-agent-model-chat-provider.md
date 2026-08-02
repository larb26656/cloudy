---
title: Add per-session agent/model selection with ChatProvider
slug: per-session-agent-model-chat-provider
id: 20260802-per-session-agent-model-chat-provider
status: ready
created: 2026-08-02
source: planning session 2026-08-02
---

# Plan: Add Per-Session Agent/Model Selection with ChatProvider

## Why

Agent and model selection is currently global-only — stored in `useDefaultAgentStore` and `useDefaultModelStore`. User wants per-session overrides with global defaults, a Settings UI for the defaults, and clean component architecture using a ChatProvider context.

## Target file

| Path | Action |
| --- | --- |
| `apps/web-app/src/stores/sessionAgentModelStore.ts` | create |
| `apps/web-app/src/contexts/ChatContext.tsx` | create |
| `apps/web-app/src/features/settings/components/AgentModelSettings.tsx` | create |
| `apps/web-app/src/features/settings/settingsConfig.ts` | edit |
| `apps/web-app/src/routes/settings/agent-model.tsx` | create |
| `apps/web-app/src/components/chat/AgentSelector.tsx` | edit |
| `apps/web-app/src/components/chat/ModelSelector.tsx` | edit |
| `apps/web-app/src/components/chat/chat-input/ChatInput.tsx` | edit |
| `apps/web-app/src/components/chat/ChatContainer.tsx` | edit |

## Context the new session needs

### Storage architecture (3 stores)

| Store | localStorage key | Purpose |
| --- | --- | --- |
| `useDefaultAgentStore` | `"default-agent"` | Global default agent |
| `useDefaultModelStore` | `"default-model"` | Global default model |
| `sessionAgentModelStore` | `"session-agent-model"` (NEW) | Per-session overrides keyed by `sessionId` |

### Session flow

- `tab.data.sessionId` comes from `tabStore` → `ChatContent` receives it as `tab.data.sessionId`
- `ChatContent` passes `sessionId` to `ChatContainer` as prop
- `ChatContainer` creates `ChatProvider` wrapping the chat UI
- `AgentSelector` and `ModelSelector` use `useChat()` hook — no props needed

### Context value shape

```ts
type ChatContextValue = {
  sessionId: string | null;
  effectiveAgent: string | null;    // session override → global fallback → null
  effectiveModel: ModelConfig | null;
  setAgent: (agent: string | null) => void;   // null = clear session override, use global
  setModel: (model: ModelConfig | null) => void;
};
```

### Key file references

- `ChatContainer.tsx:57-67` — `ensureSessionId` shows how `sessionId` flows from props to child components
- `ChatContent.tsx:25-29` — passes `sessionId` to `ChatContainer` via `tab.data.sessionId`
- `AgentSelector.tsx:29` — current initialization from global store
- `ModelSelector.tsx:58` — current initialization from global store
- `ChatInput.tsx:44-45` — current reads of global default stores

### Stores to read before implementing

- `src/stores/defaultAgentStore.ts` — global default agent pattern
- `src/stores/defaultModelStore.ts` — global default model pattern
- `src/components/chat/AgentSelector.tsx` — will replace local state + global store with `useChat()`
- `src/components/chat/ModelSelector.tsx` — same pattern

### Settings page pattern

Existing settings at `/settings/appearance` uses:
- `settingsConfig.ts` → section registry (add new `agent-model` entry)
- `routes/settings/appearance.tsx` → route component rendering `AppearanceSettings`
- `features/settings/components/AppearanceSettings.tsx` → settings UI component

New `AgentModelSettings` will follow identical pattern, using `useAgents()` and `useModels()` hooks.

## Tasks

- [ ] 1. **Create `sessionAgentModelStore.ts`**
  - verify: `pnpm --filter web-app check-types` passes with new store imported
  - files: `apps/web-app/src/stores/sessionAgentModelStore.ts`

- [ ] 2. **Create `ChatContext.tsx` with `ChatProvider` and `useChat` hook**
  - verify: `pnpm --filter web-app check-types` passes with context imported
  - files: `apps/web-app/src/contexts/ChatContext.tsx`

- [ ] 3. **Update `AgentSelector.tsx` — replace local state + global store with `useChat()`**
  - verify: `pnpm --filter web-app check-types` passes
  - files: `apps/web-app/src/components/chat/AgentSelector.tsx`

- [ ] 4. **Update `ModelSelector.tsx` — replace local state + global store with `useChat()`**
  - verify: `pnpm --filter web-app check-types` passes
  - files: `apps/web-app/src/components/chat/ModelSelector.tsx`

- [ ] 5. **Update `ChatInput.tsx` — remove agent/model props, render selectors**
  - verify: `pnpm --filter web-app check-types` passes; ChatInput renders AgentSelector + ModelSelector
  - files: `apps/web-app/src/components/chat/chat-input/ChatInput.tsx`

- [ ] 6. **Update `ChatContainer.tsx` — wrap content with `ChatProvider`**
  - verify: `pnpm --filter web-app check-types` passes
  - files: `apps/web-app/src/components/chat/ChatContainer.tsx`

- [ ] 7. **Create `AgentModelSettings.tsx` in settings**
  - verify: `pnpm --filter web-app check-types` passes
  - files: `apps/web-app/src/features/settings/components/AgentModelSettings.tsx`

- [ ] 8. **Update `settingsConfig.ts` — add `agent-model` section**
  - verify: `pnpm --filter web-app check-types` passes
  - files: `apps/web-app/src/features/settings/settingsConfig.ts`

- [ ] 9. **Create `routes/settings/agent-model.tsx` route**
  - verify: `pnpm --filter web-app check-types` passes; route at `/settings/agent-model` works
  - files: `apps/web-app/src/routes/settings/agent-model.tsx`

## Done when

- [ ] `pnpm --filter web-app lint && pnpm --filter web-app check-types` passes
- [ ] New session uses global default agent/model (no session-specific override yet)
- [ ] Selecting agent/model in chat saves to session store (persists across app restart)
- [ ] Opening two chat tabs with different sessions shows different agent/model selections
- [ ] Settings → Agent & Model page allows configuring global defaults via dropdowns
- [ ] Selecting "Use Default Agent" / "Use Default Model" in dropdown clears session override

## Notes for implementer

- **No comments unless asked** — match existing code style
- **ESM only** — no `require()` or CommonJS
- **Use `import type { Foo }`** for types-only imports even in backend code
- **Test the full flow manually**: open 2 chat tabs, pick different agents/models, switch between tabs, restart app, verify state persists
- Run `pnpm --filter web-app exec vitest run` after changes to verify no test regressions
