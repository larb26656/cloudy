---
id: 0005-use-tab-templates-as-the-single-title-source
title: Use tab templates as the single title source
status: accepted
date: 2026-08-09
deciders: cloudy team
---

# ADR 0005: Use tab templates as the single title source

## Status

Accepted on 2026-08-09.

## Context

The home tab registry already owns each tab type's icon, main content, create
dialog, and close behavior in `src/features/home/tabs/template/`. Display titles
were an exception. Each of the five tab types had a separate `*TabItem.tsx`
component for the tab bar, while `AllTabsDialog.tsx` maintained a second
`switch (tab.type)` to derive card titles and workspace identifiers.

Those two paths had already diverged. A chat tab bar read the latest session
title through `useSession`, but All Tabs showed its persisted `sessionName`.
Likewise, a terminal tab bar read the workspace name through `useWorkspace`,
while All Tabs showed a fixed fallback. Adding a tab type also required updating
both its implementation folder and the centralized switch.

The chosen abstraction must support titles derived directly from persisted tab
data and titles derived from React Query. A synchronous string resolver alone
cannot read query state, and persisting derived display titles would introduce
duplicated state into the versioned tab store.

## Decision

We will make each `TabTemplate` the single source of truth for its display
title through `TitleComponent`, with an optional `getWorkspaceId` resolver.

`TabTitle` performs the registry lookup and renders the template-owned title
component. The shared `TabBarItem` and `AllTabsDialog` both use this boundary,
so query-backed titles re-render wherever they are displayed and new tab types
do not require a centralized title switch. The dynamic registry dispatch uses
one deliberately contained type erasure after each template's own declaration
has been type-checked.

## Consequences

- **Positive:**
  - Tab bar and All Tabs use the same title behavior, including current Chat
    session titles and Terminal workspace names.
  - Adding a tab type keeps title and workspace-display responsibility beside
    that type's data and content definition.
  - Five structurally identical tab-item components are replaced by one shared
    tab-bar renderer.
- **Negative:**
  - The registry lookup needs a localized generic type cast because TypeScript
    cannot preserve the correlation between a runtime template lookup and the
    discriminated `Tab` union.
  - Query-backed titles can mount in more than one surface; React Query shares
    the cache, but each surface still owns a subscriber.
- **Neutral:**
  - A future tab type with custom tab-chip layout will need a new explicit
    extension point instead of a per-template tab-bar component.

## Alternatives Considered

- **Keep the centralized `AllTabsDialog` switch** — rejected: it duplicates
  per-type display behavior and had already produced stale and inconsistent
  titles.
- **Use only a synchronous metadata/title resolver** — rejected: it cannot
  read `useSession` or `useWorkspace`, so query-backed tab-bar titles and All
  Tabs titles would diverge.
- **Persist derived display titles in the tab store** — rejected: query data
  would be duplicated into persisted state, requiring migrations and explicit
  cache-to-store synchronization to avoid stale values.
- **Use a template `useCardMeta` hook** — rejected: it keeps the per-type tab
  item layer and hides React hook calls behind a dynamically selected property
  instead of making the query-backed rendering boundary explicit.

## Related

- `apps/web-app/src/features/home/tabs/template/tabTemplates.ts`
- `apps/web-app/src/features/home/tabs/template/TabTitle.tsx`
- `apps/web-app/src/features/home/components/TabBarItem.tsx`
- `apps/web-app/src/features/home/components/AllTabsDialog.tsx`
