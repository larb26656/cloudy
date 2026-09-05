---
title: Add image attachment types and prompt payload plumbing
slug: chatinput-image-attachments-data-layer
id: 20260905-chatinput-image-attachments-data-layer
status: ready
created: 2026-09-05
source: planning session 2026-09-05
---

# Plan: Add image attachment types and prompt payload plumbing

## Why

The `ChatInput` in `apps/web-app` only carries `text` + `mentions` today
(`apps/web-app/src/lib/opencode/chat-input.ts:7`). To support attaching images (paste / drop
/ file picker), the content shape needs an `attachments` array and `buildParts()` in
`useMessages.ts` needs to emit `FilePartInput` parts from those attachments — that is the
data-layer plumbing for the feature. A follow-up plan adds the UI handlers, chips, and
submit-button guard.

Outcome: a fresh UI session can build against a `ChatInputContent { text, mentions,
attachments }` shape and `buildParts()` will round-trip each attachment into a
`FilePartInput` that opencode accepts. opencode itself takes image attachments as
`data:<mime>;base64,...` URLs in `FilePartInput.url` (see upstream
`packages/app/src/components/prompt-input/build-request-parts.ts` — the web client encodes
the file to a base64 data URL and passes it as `url`), so no upload endpoint is required.

## Target file

| Path                                            | Action                                                       |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `apps/web-app/src/lib/opencode/chat-input.ts`   | edit — add `ImageAttachment` type, extend `ChatInputContent` |
| `apps/web-app/src/hooks/queries/useMessages.ts` | edit — `buildParts()` maps `attachments` → `FilePartInput`   |

## Context the new session needs

- **Current shape** (must be preserved):
  `apps/web-app/src/lib/opencode/chat-input.ts:7` defines `ChatInputContent = { text: string;
mentions: MentionAttrs[] }`. Add `attachments: ImageAttachment[]` so every existing call
  site that constructs `ChatInputContent` (search for `: ChatInputContent` and
  `ChatInputContent =`) keeps compiling — most pass an inline object literal and will need
  to gain `attachments: []` (or be updated by the UI plan to use the new state).
- **`MentionAttrs`** is already exported from the same file. Follow that pattern for the
  new `ImageAttachment` export.
- **Where the new field is consumed**: `apps/web-app/src/hooks/queries/useMessages.ts:67`
  `buildParts(directory, content)` currently returns
  `[textPart, ...mentionParts]`. Extend it to append `attachmentParts` derived from
  `content.attachments`. Each part is:
  ```ts
  { type: "file", mime: a.mime, url: a.dataUrl, filename: a.filename }
  ```
  No `source` is set — only mentions carry `source` (cite ranges). Don't add one.
- **opencode SDK type**: `FilePartInput` lives at
  `node_modules/.pnpm/@opencode-ai+sdk@1.18.13/node_modules/@opencode-ai/sdk/dist/v2/gen/types.gen.d.ts:2111`
  and requires `type: "file"`, `mime: string`, `url: string`. `filename?` is optional but
  set it. The `POST /session/{id}/message` payload accepts the union
  `TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput` (line 8373 of the
  same file).
- **Why data URL over proxy upload**: opencode has no `/upload` endpoint (server docs at
  https://opencode.ai/docs/server/ list no such route). The official web client sends
  images as `data:<mime>;base64,...` directly in `FilePartInput.url`. We mirror that — no
  server changes, no storage.
- **Conventions from `apps/web-app/AGENTS.md`**:
  - Type-only imports use `import type`. Frontend has `verbatimModuleSyntax` on
    (`packages/typescript-config/vite-react.json`).
  - New code uses Zod schemas for runtime-validated request/response shapes — **not**
    applicable here, this is a pure in-memory type.
  - Use `import type { Foo }` even for types that are only used in type positions.
  - No comments unless asked.
  - Switch selectors individually on Zustand stores; don't wholesale destructure (not
    relevant to this plan).
- **Enforced limits (decided by the user during planning)**:
  - MIME prefix must be `image/` (e.g. `image/png`, `image/jpeg`, `image/gif`,
    `image/webp`). Non-image MIME is rejected by the UI plan before reaching `buildParts`,
    so `buildParts` itself can be permissive — but still trust `mime` from the caller.
  - No size cap and no per-message count cap were decided for v1. The UI plan will cap at
    **5 attachments per message** as a UX safeguard (chosen during planning). Data layer
    doesn't enforce this; the UI plan does.

## Tasks

- [x] 1. **Extend `ChatInputContent` with `attachments`**
  - Add and export:
    ```ts
    export interface ImageAttachment {
      id: string;
      mime: string;
      filename: string;
      dataUrl: string;
    }
    ```
  - Change `ChatInputContent` to:
    ```ts
    export interface ChatInputContent {
      text: string;
      mentions: MentionAttrs[];
      attachments: ImageAttachment[];
    }
    ```
  - verify: `pnpm --filter web-app check-types` produces TypeScript errors at every call
    site that constructs a `ChatInputContent` without `attachments` (those errors are
    fixed by the UI plan in a follow-up). An intermediate `pnpm --filter web-app exec
vitest --project jsdom run src/components/chat` may show failures — note them, do
    not fix in this plan.
  - files: `apps/web-app/src/lib/opencode/chat-input.ts`

- [x] 2. **Extend `buildParts()` to emit `FilePartInput` from attachments**
  - In `apps/web-app/src/hooks/queries/useMessages.ts:67`, after the existing
    `mentionParts` map, add:
    ```ts
    const attachmentParts: FilePartInput[] = content.attachments.map((a) => ({
      type: "file",
      mime: a.mime,
      url: a.dataUrl,
      filename: a.filename,
    }));
    return [textPart, ...mentionParts, ...attachmentParts];
    ```
  - No new imports needed: `FilePartInput` is already imported at the top of
    `useMessages.ts:13`.
  - verify: `pnpm --filter web-app check-types` — `buildParts`'s return type now includes
    the union with `FilePartInput` from attachments; assignment back to the
    `SessionPromptData.parts` slot stays compatible because the return type is already the
    union `(TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput)[]`
    (defined at `useMessages.ts:70`).
  - files: `apps/web-app/src/hooks/queries/useMessages.ts`

- [x] 3. **Smoke-check that nothing regressed for text-only and mentions-only paths**
  - verify: `pnpm --filter web-app exec vitest --project jsdom run
src/components/chat/ChatInput.component.test.tsx src/components/chat/ChatContainer.component.test.tsx`
    — text-only and mention paths still type-check and behave the same (they pass with
    `attachments: []` after the UI plan updates them; pre-UI-plan they fail to type-check
    on the inline object literals — see Done when).
  - files: —

## Done when

- [x] `ChatInputContent` has `attachments: ImageAttachment[]` and the type compiles
- [x] `buildParts()` returns one `FilePartInput` per attachment, with `mime`/`url`/`filename`
      populated from `dataUrl`/`filename`/`mime`
- [x] No new file added; no server, proxy, or schema changes
- [x] `pnpm --filter web-app lint` passes for the two touched files
- [x] `pnpm --filter web-app check-types` either passes (if no inline-construction errors)
      or produces a known set of "missing `attachments` field" errors that the UI plan
      resolves

## Notes for implementer

- Don't introduce a Zod schema for `ImageAttachment` — the value never crosses the network
  boundary as-is (it gets flattened into `FilePartInput.url` which is a string). Inline
  TS interface is the right call, matching `MentionAttrs`.
- Don't add server-side validation, persistence, or migration — images live in the prompt
  payload only.
- Do not add a per-file size cap in `buildParts`. UI plan enforces input limits; the data
  layer stays permissive.
- The implementer of the UI plan (`20260905-chatinput-image-attachments-ui`) depends on
  this plan finishing first — finish this one before starting the next.
