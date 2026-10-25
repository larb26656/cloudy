---
title: Notification Provider Profiles UI
slug: notification-provider-profiles-ui
id: 20261025-notification-provider-profiles-ui
status: ready
created: 2026-10-25
source: planning session 2026-10-25
---

# Plan: Notification Provider Profiles UI

## Why

Users need to create and manage saved notification destinations before automations can send to them. Add a settings surface backed by the notification provider API, with a provider-specific form registry so each provider can present and validate its own fields rather than being forced into one generic form. The initial form configures a Discord webhook and supports a safe test send.

## Target file

| Path                                                                    | Action                                                                |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `apps/web-app/src/hooks/queries/useNotificationProviders.ts`            | create — typed RPC queries and mutations                              |
| `apps/web-app/src/lib/cloudy/query-keys.ts`                             | edit — notification profile query keys                                |
| `apps/web-app/src/features/settings/components/notification-providers/` | create — provider-specific forms and profile management UI            |
| `apps/web-app/src/features/settings/settingsConfig.ts`                  | edit — add Notification Providers settings section                    |
| `apps/web-app/src/routes/settings/`                                     | edit — add provider settings route following existing settings routes |

## Context the new session needs

- Prerequisite: `docs/plan/20261025-notification-provider-dispatch-core.md` must be implemented. Its typed API exposes safe provider metadata, profile CRUD, and test-send; secrets are never returned.
- Read `apps/web-app/AGENTS.md` and `apps/web-app/DESIGN.md` before UI changes. Use `cloudyClient` from `apps/web-app/src/lib/api.ts`; API types are inferred from `AppType` in `@repo/contracts` and must remain type-only. Use TanStack Query for server state, not Zustand.
- Settings navigation is a section registry at `apps/web-app/src/features/settings/settingsConfig.ts:12-80`. Existing settings route files are under `apps/web-app/src/routes/settings/`; follow adjacent route and settings content conventions.
- There is already a provider-specific form registry pattern in `apps/web-app/src/features/settings/components/provider-config/registry.ts:1-21`: provider id maps to a React component, with a typed lookup. Use the same extensibility approach for notification provider forms, with props for current provider config, submit state, and save/change handlers. Discord owns a webhook field; a later provider may define unrelated fields and validation without reshaping the generic profile editor.
- Use `react-hook-form` + Zod when appropriate, `Controller`/`Field` composition and `@repo/ui/components/field`, and installed shadcn controls. Avoid returning the saved webhook URL to populate edit forms; support replacing the credential while preserving the existing secret when no replacement is entered.
- UI scope: list profiles, create/edit/delete a profile, choose from provider catalog, render the matching provider-specific form, and trigger test-send with visible success/failure feedback. Profile name is common metadata; destination fields are provider-owned. Do not include dispatch logs UI in this slice.
- Tests: pure provider-form registry tests under node project; settings component tests use `*.component.test.tsx` and jsdom. Follow the settings components' existing testing approach.

## Tasks

- [ ] 1. Add notification profile/provider query keys and typed RPC hooks for catalog, profile CRUD, and test-send.
  - verify: `pnpm --filter web-app check-types` passes and mutation success invalidates the profile list query.
  - files: `apps/web-app/src/hooks/queries/useNotificationProviders.ts`, `apps/web-app/src/lib/cloudy/query-keys.ts`
- [ ] 2. Create a provider-specific form registry and Discord webhook profile form.
  - verify: `pnpm --filter web-app exec vitest run src/features/settings/components/notification-providers` passes registry lookup and Discord field/validation tests; an unknown provider renders an explicit unsupported-provider state.
  - files: `apps/web-app/src/features/settings/components/notification-providers/`
- [ ] 3. Build settings list and create/edit/delete/test-send flows, then register the section and route.
  - verify: focused jsdom tests cover provider selection rendering its own form, profile CRUD, replacement-secret behavior, and test-send feedback; `pnpm --filter web-app check-types` passes.
  - files: `apps/web-app/src/features/settings/components/notification-providers/`, `apps/web-app/src/features/settings/settingsConfig.ts`, `apps/web-app/src/routes/settings/`
- [ ] 4. Run frontend quality gates and validate the settings page against the design system.
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types && pnpm --filter web-app exec vitest run src/features/settings` passes; `pnpm --filter web-app design:lint` passes.
  - files: —

## Done when

- [ ] Notification Providers is discoverable in Settings and displays saved profiles.
- [ ] Users can create, edit, delete, and test-send a Discord profile; secret values are never fetched back into the browser.
- [ ] Provider-specific forms are selected through a registry so providers may expose different controls and validation without changing the generic profile-management screen.
- [ ] Frontend lint, typecheck, focused tests, and design lint pass.

## Notes for implementer

- Do not add a runtime import from `@repo/contracts`; use typed RPC inference.
- Read `apps/web-app/DESIGN.md` before styling and use shared LoadingState/ErrorState/EmptyState components for corresponding states.
- Update this plan's checkboxes as tasks are completed.
