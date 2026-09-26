---
title: Secure browser extension context boundary: proxy
slug: secure-browser-extension-context-boundary-proxy
id: 20260921-secure-browser-extension-context-boundary-proxy
status: ready
created: 2026-09-21
source: planning session 2026-09-21
---

# Plan: Secure browser extension context boundary: proxy

## Why

Cloudy's generic `/oc/*` endpoint currently lets any browser origin access the local OpenCode proxy because the default CORS middleware reflects arbitrary origins and the proxy itself returns wildcard CORS headers. A remote web page must not be able to use a user's browser as a bridge to `localhost:4122`; only the Cloudy web UI and the installed extension may make browser-originated requests. Preserve the existing proxy temporarily for the web UI while a scoped browser-chat API is introduced separately.

## Target files

| Path                                                           | Action |
| -------------------------------------------------------------- | ------ |
| `packages/server/src/server.ts`                                | edit   |
| `packages/server/src/features/proxy/proxy.service.ts`          | edit   |
| `packages/server/src/features/proxy/proxy.integration.test.ts` | edit   |
| `packages/server/src/config/config.ts`                         | edit   |
| `apps/browser-extension/wxt.config.ts`                         | edit   |

## Context the new session needs

- `packages/server/src/server.ts:27-49` reflects every request origin when `cors` is unset. The production default must instead be deny-by-default; retain explicit configuration for the web app and extension origins.
- `packages/server/src/features/proxy/proxy.service.ts:4-8,39-45` unconditionally writes `Access-Control-Allow-Origin: *` after the app-level CORS middleware. Remove these response headers so the central CORS policy is authoritative.
- `packages/server/src/features/proxy/proxy.controller.ts:18-63` is deliberately generic during migration. Do not try to enforce browser workspace or agent policy in this proxy; that belongs to the scoped API in the next plan.
- `apps/browser-extension/wxt.config.ts:10-25` already declares the Firefox Gecko ID. Give Chrome release builds a stable extension ID strategy before adding it to CORS configuration. Do not add a client-side shared secret: packed extension assets are readable and are not credentials.
- Cloudy binds to `localhost` by default (`packages/server/src/config/config.ts:15-16`). CORS is still necessary because scripts from remote websites execute in the user's local browser.
- Server conventions are in `packages/server/AGENTS.md`: routes use feature controllers, tests use the in-memory app, and type-only imports are required where applicable.

## Tasks

- [ ] 1. **Define a deny-by-default CORS configuration that accepts explicit Cloudy web UI and extension origins, including documented development overrides.**
  - verify: `pnpm --filter @repo/server exec vitest run src/config/config.test.ts`
  - files: `packages/server/src/config/config.ts`, `packages/server/src/server.ts`
- [ ] 2. **Remove the proxy's wildcard CORS response and make preflight/normal requests use only the centralized allowlist.**
  - verify: `pnpm --filter @repo/server exec vitest run src/features/proxy/proxy.integration.test.ts`
  - files: `packages/server/src/features/proxy/proxy.service.ts`, `packages/server/src/server.ts`, `packages/server/src/features/proxy/proxy.integration.test.ts`
- [ ] 3. **Stabilize and document the release extension origin needed by the server allowlist without granting `<all_urls>` CORS access.**
  - verify: `pnpm --dir apps/browser-extension build && test -f apps/browser-extension/.output/chrome-mv3/manifest.json`
  - files: `apps/browser-extension/wxt.config.ts`
- [ ] 4. **Add integration assertions that an unlisted web origin receives no usable CORS response while configured extension and web-app origins complete preflight.**
  - verify: `pnpm --filter @repo/server exec vitest run src/features/proxy/proxy.integration.test.ts`
  - files: `packages/server/src/features/proxy/proxy.integration.test.ts`

## Done when

- [ ] With default configuration, a request with `Origin: https://evil.example` receives no `Access-Control-Allow-Origin` header from `/oc/*`.
- [ ] Explicitly configured Cloudy UI and extension origins receive correct preflight and normal response CORS headers.
- [ ] No `/oc/*` response emits `Access-Control-Allow-Origin: *`.
- [ ] `pnpm --filter @repo/server exec vitest run src/features/proxy/proxy.integration.test.ts` and `pnpm --dir apps/browser-extension build` exit successfully.

## Notes for implementer

- This is a migration guard, not the final browser authorization boundary. Do not remove `/oc` until the extension has moved to the scoped browser-chat API.
- Do not commit generated `.output/` artifacts.
