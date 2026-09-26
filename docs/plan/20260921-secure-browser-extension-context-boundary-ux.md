---
title: Secure browser extension context boundary: UX
slug: secure-browser-extension-context-boundary-ux
id: 20260921-secure-browser-extension-context-boundary-ux
status: ready
created: 2026-09-21
source: planning session 2026-09-21
---

# Plan: Secure browser extension context boundary: UX

## Why

The side panel currently reads and sends the active page's full `document.body.innerText` on every chat submission, and it automatically carries the latest text selection into the next prompt. Users cannot see the page payload in the transcript or remove it before sending, which makes accidental disclosure and prompt injection more likely. Migrate to explicit, removable context attachments that make provenance, size, and retention clear while preserving quick selection-based questions.

## Target files

| Path                                                                        | Action |
| --------------------------------------------------------------------------- | ------ |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/context.ts`      | edit   |
| `apps/browser-extension/entrypoints/sidepanel/lib/opencode/chat-actions.ts` | edit   |
| `apps/browser-extension/entrypoints/sidepanel/hooks/useChatActions.ts`      | edit   |
| `apps/browser-extension/entrypoints/sidepanel/hooks/useSelectedText.ts`     | edit   |
| `apps/browser-extension/entrypoints/sidepanel/components/ChatApp.tsx`       | edit   |
| `apps/browser-extension/entrypoints/sidepanel/components/ChatInput.tsx`     | edit   |
| `apps/browser-extension/entrypoints/sidepanel/tests/context.test.ts`        | edit   |
| `apps/browser-extension/entrypoints/sidepanel/tests/chat-actions.test.ts`   | edit   |

## Context the new session needs

- `apps/browser-extension/entrypoints/content.ts:30-38` returns `{ title, url, content: document.body.innerText }` only in response to the extension's `GET_PAGE_CONTENT` message. A normal web page cannot send this extension-runtime message, but the extension must still collect data only after user intent.
- `apps/browser-extension/entrypoints/sidepanel/lib/opencode/chat-actions.ts:42-53` currently builds and submits page context automatically. Change the default to no page attachment; an attachment must be selected in the side panel before the prompt is sent.
- `apps/browser-extension/entrypoints/sidepanel/hooks/useSelectedText.ts:3-24` stores every recent selection with no expiry or remove control. Treat it as an available draft attachment, not an implicit prompt input.
- `apps/browser-extension/entrypoints/sidepanel/lib/opencode/context.ts:10-35` uses model-facing warning text and pseudo-XML delimiters. Keep an explicit untrusted-data instruction, serialize context predictably, escape delimiter-sensitive values, and cap text length. This is defense in depth only; no text format makes prompt injection safe.
- `apps/browser-extension/entrypoints/sidepanel/components/ChatInput.tsx:63-68` currently displays selection as a non-removable badge and tooltip. Replace it with removable attachment chips and an explicit add-page action. The user must see source domain, type, and approximate size before submitting.
- Injected context is intentionally hidden from rendered history by `ChatApp.tsx:51-53`; UI must disclose that attachments are sent to Cloudy/OpenCode and retained in that chat session even if they are not rendered as regular messages.
- Follow `apps/browser-extension/AGENTS.md`: use existing `@repo/ui` components/tokens, preserve Enter/Shift+Enter/Escape behavior, and run extension compile/build plus relevant Vitest tests.

## Tasks

- [x] 1. **Represent page and selection context as bounded, labeled attachments with source URL/domain and an explicit untrusted-reference instruction.**
  - verify: `pnpm --dir apps/browser-extension exec vitest run entrypoints/sidepanel/tests/context.test.ts`
  - files: `apps/browser-extension/entrypoints/sidepanel/lib/opencode/context.ts`, `apps/browser-extension/entrypoints/sidepanel/tests/context.test.ts`
- [x] 2. **Change submission orchestration so no page or selection content is sent unless the user has attached it, and retain deduplication only for explicitly submitted attachments.**
  - verify: `pnpm --dir apps/browser-extension exec vitest run entrypoints/sidepanel/tests/chat-actions.test.ts`
  - files: `apps/browser-extension/entrypoints/sidepanel/lib/opencode/chat-actions.ts`, `apps/browser-extension/entrypoints/sidepanel/hooks/useChatActions.ts`, `apps/browser-extension/entrypoints/sidepanel/tests/chat-actions.test.ts`
- [x] 3. **Add side-panel attachment controls for adding/removing the current selection or active page, showing source and size, and disclosing session retention.**
  - verify: `pnpm --dir apps/browser-extension compile`
  - files: `apps/browser-extension/entrypoints/sidepanel/hooks/useSelectedText.ts`, `apps/browser-extension/entrypoints/sidepanel/components/ChatApp.tsx`, `apps/browser-extension/entrypoints/sidepanel/components/ChatInput.tsx`
- [ ] 4. **Manually validate that prompts without attachments do not request page data and that each selected attachment is visible and removable before send.**
  - verify: `pnpm --dir apps/browser-extension build`, load `apps/browser-extension/.output/chrome-mv3`, then confirm a plain prompt sends no page content and a selected attachment can be removed before submission
  - files: `apps/browser-extension/entrypoints/sidepanel/lib/opencode/chat-actions.ts`, `apps/browser-extension/entrypoints/sidepanel/components/ChatInput.tsx`

## Done when

- [x] Sending a normal chat message does not call `GET_PAGE_CONTENT` or include selected text unless the user attached it.
- [x] Before submission, users can see and remove every context attachment and can identify its source and approximate size.
- [x] Context is bounded and labeled as untrusted reference data; instructions contained in it are not represented as user commands.
- [x] `pnpm --dir apps/browser-extension exec vitest run`, `pnpm --dir apps/browser-extension compile`, and `pnpm --dir apps/browser-extension build` exit successfully.

## Notes for implementer

- Migrate API calls from `/oc` to the scoped browser-chat API from the companion API plan as part of the same extension touch, but do not preserve `X-OpenCode-Directory` compatibility.
- Do not promise that the model-facing warning prevents prompt injection; it complements explicit attachment UX and the server-enforced tool-free browser agent.
