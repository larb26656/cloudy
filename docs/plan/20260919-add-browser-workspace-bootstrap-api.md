---
title: Add browser workspace bootstrap API
slug: add-browser-workspace-bootstrap-api
id: 20260919-add-browser-workspace-bootstrap-api
status: ready
created: 2026-09-19
source: planning session 2026-09-19
---

# Plan: Add browser workspace bootstrap API

## Why

The browser extension needs a Cloudy-owned directory that contains its `browser` OpenCode agent, but it must not choose or hard-code a filesystem path. Cloudy must initialize that directory and expose its registered workspace through an idempotent API so the extension can bootstrap safely on first use. The created resource remains a normal `agent` workspace, so it appears and behaves like every other agent workspace in the Cloudy web UI.

## Target files

| Path                                                                                   | Action |
| -------------------------------------------------------------------------------------- | ------ |
| `packages/server/src/features/browser-workspace/browser-workspace.model.ts`            | create |
| `packages/server/src/features/browser-workspace/browser-workspace.service.ts`          | create |
| `packages/server/src/features/browser-workspace/browser-workspace.controller.ts`       | create |
| `packages/server/src/features/browser-workspace/browser-workspace.templates.ts`        | create |
| `packages/server/src/features/browser-workspace/index.ts`                              | create |
| `packages/server/src/features/browser-workspace/browser-workspace.service.test.ts`     | create |
| `packages/server/src/features/browser-workspace/browser-workspace.integration.test.ts` | create |
| `packages/server/src/container.ts`                                                     | edit   |
| `packages/server/src/server.ts`                                                        | edit   |

## Context the new session needs

- Do not add a `browser` value to `workspaceTypes`. The product decision is that this is a normal `type: "agent"` workspace which is visible in Home, selectable by the existing agent chat flow, and editable as an ordinary workspace. The browser extension alone will force `agent: "browser"`; extension changes are deliberately out of scope for this plan.
- Use a fixed workspace ID, `browser-workspace`, as the singleton identity. The directory is `path.resolve(tempWorkspaceDir, "browser")`; `tempWorkspaceDir` already defaults to `<configDir>/workspaces` in `packages/server/src/config/config.ts:43-53`, so the production default is `~/.config/cloudy/workspaces/browser`. Do not introduce a new configuration field or database migration.
- The existing workspace persistence API already supplies `findById`, `findByDirectory`, and `create` in `packages/server/src/features/workspaces/workspaces.repository.ts:15-22`, while its service converts duplicate directories into `WorkspaceConflictError` at `workspaces.service.ts:33-38`. Inject `WorkspacesRepository` directly into the browser-workspace service and make the singleton handling explicit rather than routing internally through an HTTP controller.
- The browser-workspace service must be framework-free, following the service/repository conventions in `packages/server/AGENTS.md`. It owns filesystem setup with `node:fs/promises`, but does not delete user files or delete the workspace.
- Keep the template bundled as TypeScript string constants in `browser-workspace.templates.ts`, rather than source files copied relative to the package directory. `packages/server/tsup.config.ts:4-18` bundles only `src/index.ts` and explicitly copies only Drizzle migrations, so external template assets would otherwise need new build-pipeline work. Template contents should be based on `/Users/luckytime1996/Documents/Work/ask/AGENTS.md` and `/Users/luckytime1996/Documents/Work/ask/opencode.json`, but define agent name `browser`, description for a browser side-panel assistant, and the initial tool policy. For v1 preserve the Ask-style no-tools policy: every listed tool is `false`.
- Initialization must create the directory recursively and write `AGENTS.md` plus `opencode.json` only if that individual file is absent. Never overwrite a user-modified template. If a prior initialization left the directory but not the database row, finish the missing database registration. If the fixed ID exists, return it unchanged; do not update its name, color, directory, type, or template files. If another workspace already occupies the reserved directory, return a domain conflict rather than taking it over.
- Define `GET /api/browser-workspace` and `POST /api/browser-workspace/initialize` in a dedicated controller. GET returns `{ initialized: false }` when the fixed ID is absent and `{ initialized: true, workspace, agent: "browser" }` when it exists. POST returns that initialized shape with HTTP 201 when it creates the workspace and HTTP 200 when it returns an existing one. Document both routes with `describeRoute`, as the workspace controller does in `packages/server/src/features/workspaces/workspaces.controller.ts:15-57`.
- Wire the new service into `createContainer` in `packages/server/src/container.ts:11-40` and mount its controller under `/api/browser-workspace` in `packages/server/src/server.ts:57-66`. This makes the endpoints part of `AppType`, so the browser extension and web app can consume them through the existing typed Cloudy client later.
- Tests use an in-memory SQLite database through `createTestApp` in `packages/server/src/test-utils.ts:35-48`; each filesystem test needs its own temporary `tempWorkspaceDir` and must clean it up. Existing API assertion style is in `packages/server/src/features/workspaces/workspaces.integration.test.ts:16-126`.

## Tasks

- [ ] 1. **Add a bundled Browser agent template and a Zod response model for the browser-workspace resource.**
  - verify: `pnpm --filter @repo/server exec vitest --project unit run src/features/browser-workspace/browser-workspace.service.test.ts`
  - files: `packages/server/src/features/browser-workspace/browser-workspace.templates.ts`, `packages/server/src/features/browser-workspace/browser-workspace.model.ts`
- [ ] 2. **Implement the singleton service that inspects the fixed ID, initializes the reserved directory without overwriting existing template files, and registers a normal agent workspace when necessary.**
  - verify: `pnpm --filter @repo/server exec vitest --project unit run src/features/browser-workspace/browser-workspace.service.test.ts`
  - files: `packages/server/src/features/browser-workspace/browser-workspace.service.ts`, `packages/server/src/features/browser-workspace/browser-workspace.service.test.ts`
- [ ] 3. **Expose GET status and idempotent POST initialize routes with the defined 200/201 response semantics.**
  - verify: `pnpm --filter @repo/server exec vitest --project integration run src/features/browser-workspace/browser-workspace.integration.test.ts`
  - files: `packages/server/src/features/browser-workspace/browser-workspace.controller.ts`, `packages/server/src/features/browser-workspace/index.ts`, `packages/server/src/features/browser-workspace/browser-workspace.integration.test.ts`
- [ ] 4. **Inject the browser-workspace service and mount its controller without changing the existing workspace CRUD API.**
  - verify: `pnpm --filter @repo/server check-types && pnpm --filter @repo/server exec vitest --project integration run src/features/browser-workspace/browser-workspace.integration.test.ts`
  - files: `packages/server/src/container.ts`, `packages/server/src/server.ts`
- [ ] 5. **Run the backend quality checks for the completed feature.**
  - verify: `pnpm --filter @repo/server lint && pnpm --filter @repo/server check-types && pnpm --filter @repo/server test`
  - files: `packages/server/src/features/browser-workspace/browser-workspace.service.test.ts`, `packages/server/src/features/browser-workspace/browser-workspace.integration.test.ts`

## Done when

- [ ] `GET /api/browser-workspace` returns `{ "initialized": false }` before initialization, and returns the stored agent workspace plus `agent: "browser"` afterwards.
- [ ] The first `POST /api/browser-workspace/initialize` creates a normal `agent` workspace at `<tempWorkspaceDir>/browser`, creates both template files, and returns HTTP 201.
- [ ] A subsequent initialize request returns HTTP 200 with the same workspace and does not overwrite either template file.
- [ ] The service rejects a different workspace already registered at the reserved browser directory rather than mutating it.
- [ ] `pnpm --filter @repo/server lint && pnpm --filter @repo/server check-types && pnpm --filter @repo/server test` exits successfully.

## Notes for implementer

- This plan intentionally covers multiple files because a self-contained server feature requires its model, service, controller, dependency wiring, and both test layers. Keep the browser extension and web-app consumption in separate plans.
- Use type-only imports for types. Services throw domain errors, repositories throw plain `Error`, and route handlers remain thin per `packages/server/AGENTS.md`.
- Do not add filesystem deletion, template upgrade/overwrite behavior, a UI flow, extension storage, or a new workspace type in this implementation.
