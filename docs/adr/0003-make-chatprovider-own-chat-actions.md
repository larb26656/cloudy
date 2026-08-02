---
id: 0003-make-chatprovider-own-chat-actions
title: Make ChatProvider own chat actions
status: accepted
date: 2026-08-03
deciders: cloudy team
---

# ADR 0003: Make ChatProvider Own Chat Actions

## Status

Accepted on 2026-08-03.

## Context

`apps/web-app/src/components/chat/ChatContainer.tsx` owns message submission, generation cancellation, lazy session creation, slash-command dispatch, and immediate command dispatch. `ChatInput` receives those behaviors through callback props even though it already consumes `ChatProvider` for its directory and selected agent/model.

Other chat descendants need the same actions, but callback props would have to be threaded through each intermediate component. The actions also depend on the active session, directory, selected model, selected agent, and the existing mutation hooks, so duplicating their setup in consumers would risk divergent behavior.

The Session Picker remains rendered by the container, but system commands and other descendants need to open it. Session changes must still be delegated to the parent because it owns the tab's persisted `sessionId`.

## Decision

We will make `ChatProvider` the scoped runtime owner of message sending, generation cancellation, and immediate system-command execution.

`useChat()` exposes these actions with their generation state, session-change bridge, and Session Picker state. `ChatContainer` supplies the parent callback for session changes and renders the dialog, but does not pass chat-scoped state through an intermediate component.

## Consequences

- **Positive:**
  - Any descendant of `ChatProvider` can use the same send, abort, and command behavior without callback prop drilling.
  - Lazy session creation, command dispatch, and send-error reporting have one implementation.
- **Negative:**
  - `ChatProvider` now depends on query mutations and command hooks, making it a runtime boundary rather than a selection-only context.
  - Provider consumers re-render when its generation state changes.
- **Neutral:**
  - The Session Picker remains rendered by `ChatContainer`, while `ChatProvider` owns whether it is open.

## Alternatives Considered

- **Continue passing callbacks through `ChatInput`** — rejected because each additional chat consumer would need new props through intermediate components despite already being within the provider scope.
- **Put chat actions in a global Zustand store** — rejected because actions require the current provider-scoped directory, session, model, and UI callbacks; global state would either duplicate that context or add implicit coupling.

## Related

- [ADR 0002: Per-Session Agent/Model State via ChatProvider](0002-per-session-agent-model-via-chat-provider.md)
