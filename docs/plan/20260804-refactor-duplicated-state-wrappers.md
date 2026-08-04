---
title: Refactor duplicated loading/error wrappers
slug: refactor-duplicated-state-wrappers
id: 20260804-refactor-duplicated-state-wrappers
status: ready
created: 2026-08-04
source: planning session 2026-08-04
---

# Plan: Refactor duplicated loading/error wrappers

## Why

Several components render the **same outer wrapper JSX** (`<section>`, `<div>`) in every
state branch (loading / error / empty / success) by using multiple early `return`
statements. The wrapper and its header get copy-pasted across 3–4 return sites, so any
className or header change must be repeated N times. We want each component to compute a
single `content` node via an `if/else` chain and return **one** wrapper that renders
`{content}` — the same shape already used in `TerminalView.tsx`'s `renderOverlay` helper.

Follow-up to the `20260804-phase-1..phase-2d-*` state-component migration plans: those
migrated the _inner_ state JSX to shared components; this plan deduplicates the _outer_
wrappers that were left behind.

## Target file

| Path                                                                  | Action |
| --------------------------------------------------------------------- | ------ |
| `apps/web-app/src/features/home/components/RecentSessionsSection.tsx` | edit   |
| `apps/web-app/src/routes/workspace/$workspaceId.tsx`                  | edit   |

## Context the new session needs

**The anti-pattern.** Multiple early `return (` statements where each return wraps the
state component in the same outer container + header. Example —
`RecentSessionsSection.tsx:28-76` returns four times, each repeating
`<section className="mb-9"><h2 className="mb-3.5 text-sm font-bold">Recent sessions</h2>`
(lines 30-31, 42-43, 52-53, 60-61). The same shape lives in
`routes/workspace/$workspaceId.tsx:12-42` — three returns each wrapping
`<div className="h-full overflow-y-auto">` (lines 14, 22, 34).

**The target pattern (content-variable).** Declare one `let content: ReactNode`, fill it
via an `if/else if … else` chain, then return a single wrapper:

```tsx
let content: ReactNode;
if (isLoading)      { content = <LoadingState .../>; }
else if (error)     { content = <ErrorState .../>; }
else if (!data?.length) { content = <EmptyState .../>; }
else                { content = <ListLayout .../>; }
return <Wrapper>{content}</Wrapper>;
```

This is the exact shape already used in `apps/web-app/src/components/terminal/TerminalView.tsx`
(the `renderOverlay` helper at `TerminalView.tsx:46-84` returns content, single wrapper
return at `:34-44`) — read it as the reference implementation of the pattern.

**Type import convention.** The codebase does **not** use a namespace `React` import. Use
`import type { ReactNode } from "react"` and declare `let content: ReactNode;` (see
`SessionList.tsx:1` for the import style). Do **not** write `React.ReactNode` unless you
also add a React import — prefer the named type import.

**Conventions** (from `apps/web-app/AGENTS.md`):

- Keep using the shared `LoadingState` / `ErrorState` / `EmptyState` components unchanged —
  this plan only moves where they're rendered, not their props.
- No comments unless asked. Match existing `camelCase` / formatting (Prettier defaults).
- `routes/workspace/$workspaceId.tsx` is a TanStack Router file-based route — keep the
  `createFileRoute` export and `Route.useParams()` usage intact.

**Scope guard — files explicitly NOT in this plan (already verified clean, do not touch):**

- `WorkspacesSection.tsx` — already a single `<section>` with an inline ternary chain. Clean.
- `SessionList.tsx` — loading/error early-returns are bare (no wrapper duplication);
  refactoring would change behavior (the "New chat" header is currently hidden while
  loading). Leave as-is unless a separate behavior change is requested.
- `WorkspaceSelectStep.tsx`, `RecentDesksSection.tsx` — not the duplicated-wrapper pattern.

## Tasks

- [ ] 1. **Refactor `RecentSessionsSection.tsx` to the content-variable pattern.**
     Replace the four early returns (`:28-76`) with a single `let content: ReactNode` +
     `if/else` chain + one `<section className="mb-9">` return that renders `{content}`. Use
     this exact body (add `import type { ReactNode } from "react"` at the top, remove nothing
     else from imports):

  ```tsx
  export function RecentSessionsSection() {
    const {
      data: sessions,
      isLoading,
      error,
    } = useRecentSessions({ limit: 8 });
    const { data: workspaces = [] } = useWorkspaces();
    const addTab = useTabStore((s) => s.addTab);

    const directoryToWorkspace = (directory: string): Workspace | undefined =>
      workspaces.find((workspace) => workspace.directory === directory);

    const handleOpen = (session: Session) => {
      const workspace = directoryToWorkspace(session.directory);
      addTab("chat", {
        sessionId: session.id,
        workspaceId: workspace?.id ?? session.directory,
        sessionName: session.title || "New Chat",
      });
    };

    let content: ReactNode;
    if (isLoading) {
      content = (
        <LoadingState
          size="inline"
          title="Loading sessions..."
          spinner={false}
        />
      );
    } else if (error) {
      content = (
        <ErrorState size="inline" bare message="Failed to load sessions" />
      );
    } else if (!sessions?.length) {
      content = <EmptyState size="inline" title="No sessions yet" />;
    } else {
      content = (
        <div className="flex flex-col gap-1.5">
          {sessions.map((session) => {
            const workspace = directoryToWorkspace(session.directory);
            return (
              <SessionRow
                key={session.id}
                session={session}
                workspaceName={workspace?.name}
                onClick={() => handleOpen(session)}
              />
            );
          })}
        </div>
      );
    }

    return (
      <section className="mb-9">
        <h2 className="mb-3.5 text-sm font-bold">Recent sessions</h2>
        {content}
      </section>
    );
  }
  ```

  - verify: `pnpm --filter web-app check-types` passes; the Home page still shows the
    "Recent sessions" header in all four states (load the page with no sessions, with
    sessions, and with the server down).
  - files: `apps/web-app/src/features/home/components/RecentSessionsSection.tsx`

- [ ] 2. **Refactor `routes/workspace/$workspaceId.tsx` to the content-variable pattern.**
     Replace the three early returns (`:12-42`) with a `let content: ReactNode` chain and a
     single `<div className="h-full overflow-y-auto">{content}</div>` return. The success
     branch keeps its nested `<div className="mx-auto w-full max-w-3xl px-6 py-10">` inside
     `content`; loading/error become just the state component. Add
     `import type { ReactNode } from "react"`. Keep the `createFileRoute` export and
     `Route.useParams()` unchanged. Preserve the exact `ErrorState` props
     (`title="Workspace not found"`, `message={error?.message}`,
     `onRetry={() => navigate({ to: "/" })}`, `retryLabel="Back to Home"`).
  - verify: `pnpm --filter web-app check-types` passes; navigating to
    `/workspace/<id>` shows the scroll container in loading, error, and success states.
  - files: `apps/web-app/src/routes/workspace/$workspaceId.tsx`

## Done when

- [ ] `pnpm --filter web-app lint && pnpm --filter web-app check-types` passes with no
      errors.
- [ ] `RecentSessionsSection.tsx` has exactly one `return (` statement and the string
      `<section className="mb-9">` / the "Recent sessions" `<h2>` each appear exactly once.
- [ ] `routes/workspace/$workspaceId.tsx` has exactly one `return (` statement in
      `WorkspacePage` and `className="h-full overflow-y-auto"` appears exactly once.
- [ ] No visual/behavior change on the Home page or the workspace detail route across
      loading / error / empty / success states.

## Notes for implementer

- Two files only. Do **not** loop in `WorkspacesSection.tsx`, `SessionList.tsx`,
  `WorkspaceSelectStep.tsx`, or `RecentDesksSection.tsx` — see the scope guard above.
- Use `import type { ReactNode } from "react"` + `let content: ReactNode;`. No namespace
  `React.*` import.
- No comments unless asked.
- Run `pnpm --filter web-app lint && pnpm --filter web-app check-types` before finishing.
- If the Home page or workspace route is rendered in Storybook, eyeball it there too;
  otherwise a manual dev check is sufficient (no component test exists for these two files
  today).
