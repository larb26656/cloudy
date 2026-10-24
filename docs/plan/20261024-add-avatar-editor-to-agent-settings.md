---
title: Add avatar editor to Agent Settings
slug: add-avatar-editor-to-agent-settings
id: 20261024-add-avatar-editor-to-agent-settings
status: ready
created: 2026-10-24
source: planning session 2026-10-24
---

# Plan: Add avatar editor to Agent Settings

## Why

The Agent Settings page lets users edit an agent's name and system prompt but offers no way to view or change its avatar. Add an Avatar section to each agent edit flow, with a compact current-avatar affordance that opens the existing `AgentAvatarBuilder` inside its own dialog and saves the resulting recipe back to the agent form.

## Target file

| Path                                                                    | Action |
| ----------------------------------------------------------------------- | ------ |
| `apps/web-app/src/features/settings/components/CloudyAgentSettings.tsx` | edit   |

## Context the new session needs

- Complete the prerequisite persistence plan first: `docs/plan/20261024-persist-agent-avatar-recipe.md`. The query hook derives `CloudyAgent` and `CloudyAgentInput` directly from the typed API response in `apps/web-app/src/hooks/queries/useCloudyAgents.ts:5-11`, so the avatar field will arrive without a separate hook change.
- `CloudyAgentSettings.tsx:35-45` owns the parent agent dialog state (`editing`, `open`, `name`, `systemPrompt`). Add the draft avatar recipe to this same state and initialise it from `agent.avatar` when editing; use `defaultAgentAvatar` when no saved recipe exists.
- `CloudyAgentSettings.tsx:47-64` builds one `CloudyAgentInput` for both create and update operations. Include the draft avatar in that object so the existing mutations persist it.
- The parent dialog begins at `CloudyAgentSettings.tsx:143`. Add a clearly labelled Avatar section to its form; show a small rendered `AgentAvatar` and an `Edit avatar` button rather than embedding the full builder in the agent form.
- `AgentAvatarBuilder` already manages a reactive form and invokes `onSubmit(recipe)` (`apps/web-app/src/components/agent-avatar/AgentAvatarBuilder.tsx:106-118`). Open it in a nested, controlled dialog. On builder submit, update only the parent's draft avatar and close the editor dialog; do not call the network mutation until the user saves the parent agent dialog.
- The builder has a fixed responsive shell with its own scrolling and a viewport-derived maximum height (`AgentAvatarBuilder.tsx:113-117`). Give the editor dialog a wide, height-bounded content area that does not introduce a second competing page scroll; preserve the builder's mobile preview-first and medium-up preview-right layout.
- Follow frontend conventions from `apps/web-app/AGENTS.md`: use the shared `@repo/ui` dialog and button primitives, `@/` imports, `import type` for types, Tailwind utilities, and no new component-local test framework unless the existing test matrix warrants it.

## Tasks

- [x] 1. **Track an agent-avatar draft alongside the existing name and system-prompt draft, seeded from the selected agent or the default recipe.**
  - verify: `pnpm --filter web-app check-types`
  - files: `apps/web-app/src/features/settings/components/CloudyAgentSettings.tsx`
- [x] 2. **Add an Avatar section to the create/edit agent dialog that shows the current recipe and opens a controlled avatar-editor dialog.**
  - verify: `pnpm --filter web-app check-types`
  - files: `apps/web-app/src/features/settings/components/CloudyAgentSettings.tsx`
- [x] 3. **Wrap `AgentAvatarBuilder` in the editor dialog and transfer its submitted recipe back to the parent draft without prematurely saving the agent.**
  - verify: `pnpm --filter web-app build-storybook`
  - files: `apps/web-app/src/features/settings/components/CloudyAgentSettings.tsx`
- [x] 4. **Include the selected avatar in the existing create/update input and visually verify reopen, cancel, and save behavior.**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types`
  - files: `apps/web-app/src/features/settings/components/CloudyAgentSettings.tsx`

## Done when

- [x] Editing an agent shows its saved avatar, and an agent without one starts from the default recipe.
- [x] Selecting options in the nested builder updates the parent dialog's avatar preview only after the builder is saved; cancelling it leaves the parent draft unchanged.
- [x] Saving the parent agent dialog sends the complete recipe through the existing create/update mutation, and reopening the agent restores that recipe.
- [x] The avatar editor is usable at mobile width and at `md` and wider without the preview escaping its dialog.

## Notes for implementer

Use one nested-dialog state flag separate from the parent agent-dialog `open` flag. Do not put SVG markup in settings state; pass the recipe to `AgentAvatar` and `AgentAvatarBuilder`.
