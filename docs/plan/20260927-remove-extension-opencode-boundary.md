---
title: Remove Extension OpenCode Boundary
slug: remove-extension-opencode-boundary
id: 20260927-remove-extension-opencode-boundary
status: ready
created: 2026-09-27
source: planning session 2026-09-27
---

# Plan: Remove Extension OpenCode Boundary

## Why

After sessions, chat actions, catalog, and events use Cloudy's provider API, the extension's
OpenCode SDK client and direct SDK dependency become obsolete. Remove the unused boundary and
update repository guidance and manifests so the extension's supported runtime no longer
depends on `/oc` or `@opencode-ai/sdk`.

## Target file

| Path                                                                    | Action                               |
| ----------------------------------------------------------------------- | ------------------------------------ |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/client.ts`   | delete                               |
| `apps/browser-extension/package.json`                                   | edit                                 |
| `apps/browser-extension/AGENTS.md`                                      | edit                                 |
| `pnpm-lock.yaml`                                                        | edit                                 |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/events.ts`   | edit if stale adapter exports remain |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/sessions.ts` | edit if stale adapter exports remain |

## Context the new session needs

- Current SDK coupling is visible in `apps/browser-extension/package.json:21` and the client
  boundary at `entrypoints/sidepanel/lib/opencode/client.ts:1-13`. It must not be removed until
  the three preceding plans and their tests are complete.
- `@repo/opencode` may still be retained if the extension uses its normalized streaming store;
  do not remove it merely because the OpenCode SDK disappears from the extension. Its SDK
  dependency is an internal adapter concern unless a separate package migration is planned.
- The server `/oc` proxy in `packages/server/src/features/proxy` is shared infrastructure and
  must remain until a repository-wide search confirms no supported client uses it. This plan
  removes the extension consumer, not the backend route.
- Update `apps/browser-extension/AGENTS.md` architecture statements from SDK `/oc` calls to
  the provider API while retaining the rule that provider integrations stay behind Cloudy.
- Keep generated `.output/`, `.wxt/`, and `.turbo/` artifacts out of the change. Refresh the
  lockfile through pnpm rather than hand-editing dependency resolution data.

## Tasks

- [x] 1. Search the extension source and tests for SDK/client imports and remove stale imports or adapter-only exports left by the transport migration.
  - verify: `! rg -n '@opencode-ai/sdk|createClient|CLOUDY_PROXY_URL|/oc' apps/browser-extension/entrypoints apps/browser-extension/tests`
  - files: `apps/browser-extension/entrypoints/sidepanel/lib/opencode/client.ts`, `apps/browser-extension/entrypoints/sidepanel/lib/opencode/events.ts`, `apps/browser-extension/entrypoints/sidepanel/lib/opencode/sessions.ts`
- [x] 2. Remove the direct SDK dependency and refresh the workspace lockfile.
  - verify: `pnpm install --lockfile-only && pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/package.json`, `pnpm-lock.yaml`
- [x] 3. Update extension architecture guidance and run full extension verification.
  - verify: `pnpm --dir apps/browser-extension exec vitest run && pnpm --dir apps/browser-extension compile && pnpm --dir apps/browser-extension build`
  - files: `apps/browser-extension/AGENTS.md`
- [x] 4. Confirm `/oc` remains only where intentionally supported by the backend and no extension bundle references it.
  - verify: `! rg -n '@opencode-ai/sdk|/oc' apps/browser-extension --glob '!*.md' --glob '!package.json' && rg -n '"@opencode-ai/sdk"' packages/server/package.json packages/opencode/package.json`
  - files: —

## Done when

- [x] The extension has no runtime or test import of `@opencode-ai/sdk` and no `/oc` transport.
- [x] Extension compile, tests, and Chrome production build pass.
- [x] The server `/oc` proxy is retained only as intentional backend compatibility until separately deprecated.

## Notes for implementer

- Do not delete the server proxy in this plan.
- Run repository lint/typecheck if shared packages or their public types changed.
- Do not commit generated extension build directories.
