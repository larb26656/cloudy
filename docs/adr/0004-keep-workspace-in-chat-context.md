---
id: 0004-keep-workspace-in-chat-context
title: Keep Workspace in chat context instead of resolving at the leaf
status: accepted
date: 2026-08-08
deciders: cloudy team
---

# ADR 0004: Keep Workspace in chat context instead of resolving at the leaf

## Status

Accepted on 2026-08-08.

## Context

The chat surface's `SessionStatusBar` (`src/components/chat/SessionStatusBar.tsx`)
shows the workspace identity — the workspace name plus a colored dot. The
`Workspace` object is already resolved exactly once at the chat entry points:

- `ChatPage` (`src/features/chat/ChatPage.tsx:25`) calls `useWorkspace(selectedWorkspaceId)`
  to read `directory` (and to guard against no selection).
- `ChatNode` (`src/features/desk/nodes/implementations/chat-node/ChatNode.tsx:24`)
  calls `useWorkspace(data.workspaceId)` to derive `directory`.

The resolved object is then threaded through props and context:
caller → `ChatContainer` → `ChatProvider` (context) → `ChatContainerContent`
→ `SessionStatusBar`, which reads `workspace.name`.

A refactor was proposed to drop this threading: carry only `workspaceId` in
context and have `SessionStatusBar` (or `ChatProvider`) call `useWorkspace`
itself to resolve the name/color for display. The motivation: `ChatProvider`
carries a `Workspace` object it never consumes internally (it uses only
`directory` + `sessionId`), and `SessionStatusBar` is the sole reader — so the
object looks like dead weight, and a leaf resolving its own id is a common
react-query idiom.

This created a genuine fork worth recording: should a presentational leaf that
needs server-derived _display_ data stay dumb and read a threaded object from
context, or become semi-smart and fetch via the query hook?

## Decision

We keep `SessionStatusBar` as a dumb presentational leaf that reads the
already-resolved `Workspace` object from `ChatProvider` context. We do **not**
have `SessionStatusBar` or `ChatProvider` re-resolve `workspaceId`.

The object is resolved once by the entry-point caller (which needs `directory`
regardless) and reused by the one display consumer via context. That is normal
provider behavior — the provider carries data its children need — not a smell.
Re-resolving at the leaf would add `useWorkspace` calls purely for display while
saving nothing, because the caller still must resolve for `directory`.

Concretely, the standalone workspace dot that used to render separately in the
chat tab item and the chat-node title was folded into `WorkspaceBadge`
(`src/components/workspace/WorkspaceBadge.tsx`) — dot + name — reusing
`WorkspaceDot` as the single source of the dot visual. `SessionStatusBar`
passes `workspace.id` to `WorkspaceBadge`, which renders the dot, while staying
dumb and making no extra fetch.

## Consequences

- **Positive:**
  - `SessionStatusBar` remains a pure presentational leaf — easy to test and
    reason about, consistent with how it already receives `sessionId` and
    `directory` as props.
  - Zero extra `useWorkspace` calls in the chat surface; the caller's single
    resolution is reused through context.
  - `WorkspaceDot` has one source of truth for the dot visual, shared by
    `WorkspaceBadge`, `TabItemShell`, and `WindowFrame`.

- **Negative:**
  - `ChatProvider` context carries a server `Workspace` object the provider
    itself does not consume. This reads as "dead weight" to a casual reader and
    will invite future "refactor to an id" PRs — this ADR exists to head those
    off with the rationale.
  - The workspace indicator is now split across two surfaces: a badge-integrated
    dot (chat, via `WorkspaceBadge`) and a standalone dot (files/terminal tabs
    and terminal-node, via `WorkspaceDot` directly) that have no badge to join.

- **Neutral:**
  - Contributors reading `ChatProvider` should know the threaded object is
    intentional for display consumers, not because the provider needs it.

## Alternatives Considered

- **Leaf-level fetching (`SessionStatusBar` calls `useWorkspace`)** — rejected:
  it turns a presentational leaf semi-smart and adds a cached-but-redundant
  lookup; the object is already resolved by the caller, so this is
  fetching-for-display when a threaded object is already in hand.

- **Provider-level fetching (`ChatProvider` resolves `workspaceId`, exposes it
  in context)** — rejected: it pushes a `useWorkspace` call into `ChatProvider`
  purely to feed a display consumer, duplicating the resolution the entry-point
  caller already performs for `directory` (cached, but pointless) instead of
  reusing it.

- **Pure-dumb props with `ChatContainerContent` resolving** — rejected: it only
  relocates the fetch to a thin layout wrapper that is not a data-orchestration
  layer. `ChatProvider` is the natural owner of chat data and already receives
  the resolved object.

## Related

- [ADR 0002](0002-per-session-agent-model-via-chat-provider.md) — ChatProvider
  context pattern for per-session agent/model state.
- `src/components/workspace/WorkspaceBadge.tsx`, `WorkspaceDot.tsx`,
  `src/components/chat/SessionStatusBar.tsx`, `src/components/chat/ChatProvider.tsx`.
