---
title: Discuss generic Desk node lifecycle hooks
slug: discuss-generic-desk-node-lifecycle-hooks
id: 20260812-discuss-generic-desk-node-lifecycle-hooks
status: draft
created: 2026-08-12
source: planning session 2026-08-12
---

# Plan: Discuss generic Desk node lifecycle hooks

## Why

Desk-wide operations must not branch on concrete node IDs such as `node.type === "terminal"` to clean up external resources. Before terminal cleanup is expanded beyond its own close button, define a generic lifecycle contract that any stateful node can opt into without coupling the canvas to individual implementations.

## Target file

| Path                                                             | Action |
| ---------------------------------------------------------------- | ------ |
| `apps/web-app/src/features/desk/nodes/template/nodeTemplates.ts` | edit   |
| `apps/web-app/src/features/desk/DeskCanvas.tsx`                  | edit   |

## Context the new session needs

- `apps/web-app/src/features/desk/nodes/template/nodeTemplates.ts:7` defines `NodeTemplate`; it currently contains metadata and a component but no duplicate/delete lifecycle contract.
- `apps/web-app/src/features/desk/DeskCanvas.tsx:75` applies generic React Flow node changes. Keyboard deletion and `deleteElements` eventually pass through this canvas and must remain node-type agnostic.
- `apps/web-app/src/features/desk/hooks/useDeskSelectionActions.ts:53` currently duplicates arbitrary node data verbatim. Terminal `ptyId` ownership makes that unsafe, but adding a terminal-specific branch here was explicitly rejected.
- `apps/web-app/src/features/desk/nodes/implementations/terminal-node/TerminalNode.tsx:44` currently shares its `ptyId` when opening a tab and kills it only through the node's close button. Do not change these semantics until the ownership questions below are resolved.
- Follow `apps/web-app/AGENTS.md`: use the node registry workflow, keep server state out of Zustand, and run frontend lint/typecheck/tests before finishing.

## Discussion TODO — resolve before implementation

- [ ] Decide whether a lifecycle contract belongs on `NodeTemplate` or in a separate registry/service that has access to React Query and asynchronous cleanup.
- [ ] Decide whether deletion hooks are best-effort fire-and-forget or may veto/await deletion when cleanup fails.
- [ ] Decide duplicate semantics for resource-owning nodes: clone configuration and allocate a new resource, detach resource fields, or let each template provide a full data transform.
- [ ] Decide whether “Open in tab” transfers ownership, shares ownership, or creates a new PTY; document who may kill a shared session.
- [ ] Decide how closing a Desk runs cleanup for every contained resource without embedding feature-specific logic in the Desk tab template.

## Tasks

- [ ] 1. **After the discussion TODO is resolved, add the agreed type-safe lifecycle contract to `NodeTemplate`.**
  - verify: `pnpm --filter web-app check-types`
  - files: `apps/web-app/src/features/desk/nodes/template/nodeTemplates.ts`
- [ ] 2. **Invoke the generic lifecycle contract from React Flow deletion paths without checking concrete node IDs.**
  - verify: `rg -n 'type.*terminal|terminal.*type' apps/web-app/src/features/desk/DeskCanvas.tsx` returns no matches, and `pnpm --filter web-app check-types` passes
  - files: `apps/web-app/src/features/desk/DeskCanvas.tsx`

## Done when

- [ ] The discussion TODO has explicit recorded decisions and this plan is changed from `draft` to `ready`.
- [ ] Desk lifecycle code contains no terminal-specific branch or PTY-specific field access.
- [ ] Generic-node lifecycle tests cover deletion through the close button, keyboard deletion, bulk deletion, and Desk closure.
- [ ] `pnpm --filter web-app lint && pnpm --filter web-app check-types` passes.

## Notes for implementer

- Do not implement this draft until every discussion TODO item is resolved.
- Terminal-specific behavior belongs in its implementation/registration boundary, not in generic Desk infrastructure.
- If the agreed solution requires edits beyond these two files, split terminal registration and ownership behavior into separate plans before implementation.
