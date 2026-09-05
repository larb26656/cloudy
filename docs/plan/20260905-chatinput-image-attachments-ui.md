---
title: Add image attachment UI handlers and preview chips
slug: chatinput-image-attachments-ui
id: 20260905-chatinput-image-attachments-ui
status: ready
created: 2026-09-05
source: planning session 2026-09-05
---

# Plan: Add image attachment UI handlers and preview chips

## Why

The data-layer plan (`20260905-chatinput-image-attachments-data-layer`) added the
`ImageAttachment` shape and made `buildParts()` emit `FilePartInput` parts, but the UI
doesn't yet **collect** images or **show** them to the user. This plan adds the three
input paths the user picked (paste / drop / file picker), renders previews above the
editor, and lets the user send a message that contains only images.

Outcome: a user can paste an image into the chat input, drag an image file onto the input
bar, or click a paperclip button to pick one. Up to 5 images can be queued per message;
non-image files are rejected with a toast. Removing an image clears it from the queue.
Submit works even if `text` is empty as long as at least one attachment is queued.

## Target file

| Path                                                                | Action                                                                                       |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `apps/web-app/src/components/chat/chat-input/ChatInput.tsx`         | edit — paperclip button, `addImageFile` helper, drop handler, submit guard, attachment state |
| `apps/web-app/src/components/chat/chat-input/ChatInputEditor.tsx`   | edit — TipTap paste handler intercepts image files                                           |
| `apps/web-app/src/components/chat/chat-input/AttachmentPreview.tsx` | create — chip row component                                                                  |

## Context the new session needs

- **Pre-req**: finish
  `20260905-chatinput-image-attachments-data-layer` first. `ChatInputContent.attachments`
  must exist before this plan starts; otherwise `ChatInput.tsx:28` (`useState<...>`) fails
  to compile.
- **Existing flow** (`apps/web-app/src/components/chat/chat-input/ChatInput.tsx`):
  - Line 28: `useState<ChatInputContent>({ text: "", mentions: [] })` — change to include
    `attachments: []`.
  - Line 200: `<ChatInputEditor content={{ ...chatInputContent, text: displayText }} ... />`
    — also spread `attachments` so the editor knows (currently the editor doesn't read
    attachments, but the spread keeps things future-proof).
  - Line 251: `disabled={!displayText.trim()}` on the Send button — must also consider
    attachments.
  - Line 106: `handleSubmit` guards on `finalText.trim()`. It must accept "send images only".
  - Call sites that construct `ChatInputContent` (search the codebase for the literal
    `mentions: []` next to `text:` — typically within `setChatInputContent` calls inside
    `ChatInput.tsx`) all need `attachments: []` added. There are ~5 inline literal sites
    in `ChatInput.tsx` (the `useState` init + the `setChatInputContent` calls after submit,
    history navigation, etc.).
- **TipTap paste handler** (`ChatInputEditor.tsx:84` — `useEditor({...})`):
  - Use `editorProps: { handlePaste: (view, event) => ... }` on the `useEditor` options.
    Returning `true` from `handlePaste` tells TipTap "I handled this, don't do your
    default". Use that to intercept image files (`event.clipboardData.files`) before
    TipTap inserts them as text or rich content.
  - The `onChange` in `useEditor` (`ChatInputEditor.tsx:90`) only knows about `text` and
    `mentions` — it does NOT call back with attachments. Attachments are owned by the
    parent (`ChatInput.tsx`) and passed in via the `content` prop spread; the editor just
    needs to **prevent** TipTap from inserting image data into the doc.
  - The current `useEffect` at line 98 watches `content.text` and re-syncs the editor. It
    does NOT re-sync `attachments` (and shouldn't — TipTap doesn't model them). Leave it
    alone.
- **`addImageFile(file: File): boolean`** lives in `ChatInput.tsx`:
  - Returns `false` (and surfaces a toast) if `file.type` does not start with `image/`. The
    UI plan uses `toast` from `@/components/ui/sonner` (already imported in
    `ChatProvider.tsx:23` — mirror the import path here).
  - Reads the file via `FileReader.readAsDataURL` → on `load`, build an
    `ImageAttachment`:
    ```ts
    { id: crypto.randomUUID(), mime: file.type, filename: file.name, dataUrl: reader.result }
    ```
  - Appends to `attachments` state, capped at **5** items. If already at 5, drop the new
    one and toast `"Up to 5 images per message"`.
  - Returns `true` on accept, `false` on reject.
- **Three trigger points** (all call `addImageFile`):
  1. **Paste** — TipTap `handlePaste` inside `ChatInputEditor.tsx`. The handler must
     extract `event.clipboardData.items`, filter `kind === "file"`, call `getAsFile()`,
     and forward to `addImageFile`. To call `addImageFile` from the editor, lift the
     helper to `ChatInput.tsx` and pass it down via a new prop on `ChatInputEditor`:
     `onAddFiles?: (files: File[]) => void`. The `ChatInput.tsx` handler walks the array
     and calls `addImageFile` per file.
  2. **Drop** — wrap the input-bar container (the `<div>` at `ChatInput.tsx:180` that
     already has `onFocus` / `onBlur`) with `onDragOver` (preventDefault) and `onDrop`
     (preventDefault, iterate `event.dataTransfer.files`, forward via the same
     `onAddFiles`-style callback). Drop handler should be on the **outer wrapper** (the
     one with `className="p-4 @container"`) so dragging anywhere over the input bar
     works, not just on the editor surface. Match opencode upstream behavior in
     `packages/app/src/components/prompt-input/attachments.ts:handleGlobalDrop` — note
     that upstream attaches to `document`; here we attach to the input wrapper, which is
     a tighter scope and avoids fighting with other drop targets.
  3. **File picker** — add a paperclip `<Button size="icon">` with `<Paperclip />` from
     `lucide-react`, placed next to `<SpeechBtn>` at `ChatInput.tsx:232`. Pair it with a
     hidden `<input type="file" accept="image/*" multiple ref={fileInputRef} />` and a
     click handler that calls `fileInputRef.current?.click()`. Reset the input's `value`
     in `onChange` so picking the same file twice fires `onChange` again.
- **`<AttachmentPreview>` component** (new file
  `apps/web-app/src/components/chat/chat-input/AttachmentPreview.tsx`):
  - Props: `{ attachments: ImageAttachment[]; onRemove: (id: string) => void }`.
  - Renders `null` when `attachments.length === 0` (don't reserve layout space).
  - Otherwise: a horizontal flex row of chips. Each chip is a `<div>` with:
    `<img src={dataUrl} alt={filename} className="size-12 rounded object-cover" />`,
    a `<span>` truncated filename (`max-w-[8rem] truncate`), and an `<button>` with
    `<X className="size-3" />` from `lucide-react`.
  - Style: match the existing chip aesthetic — use `bg-background`, `border`, `text-xs`,
    `gap-1`. Look at the file-pill rendering inside `ChatInputEditor.tsx`'s mention
    extension for sizing reference (the existing `@mention` pill style).
  - Export as named export from the file; `ChatInput.tsx` imports it as
    `import { AttachmentPreview } from "./AttachmentPreview"`.
- **Submit guard** (`ChatInput.tsx:106` `handleSubmit`):
  - Old: `if (finalText && !isSending) { ... }`.
  - New: `if ((finalText || attachments.length > 0) && !isSending) { ... }`.
  - Old: `disabled={!displayText.trim()}` on Send button (line 251). New:
    `disabled={!displayText.trim() && attachments.length === 0}`.
  - After successful send, reset attachments alongside `text` and `mentions`:
    `setChatInputContent({ text: "", mentions: [], attachments: [] })`.
- **Storybook** (`.storybook/`):
  - Add a `WithAttachment` story to
    `apps/web-app/src/components/chat/chat-input/ChatInput.stories.tsx`. Use a fixture
    `dataUrl` (a tiny 1×1 PNG, base64 — e.g. `data:image/png;base64,iVBORw0KGgo...`) to
    simulate a queued attachment so the chip renders in isolation without needing a real
    file picker.
- **Tests** (project: `jsdom`):
  - `ChatInput.component.test.tsx`: add a `describe("ChatInput — image attachments", ...)`
    block that mocks `addImageFile` (or exercises via the picker input) and asserts:
    - Picking a file with `image/png` adds a chip.
    - Picking a file with `text/plain` does NOT add a chip (rejected).
    - Clicking the `<X>` on a chip removes the attachment.
    - Submitting with attachments only (no text) calls `sendMessage` and clears
      attachments.
  - `useMessages.test.ts` does not currently exist. Add a small unit test file
    `apps/web-app/src/hooks/queries/useMessages.test.ts` covering `buildParts`: a content
    with one attachment yields a parts array whose last element is a `FilePartInput` with
    the expected `mime` / `url` / `filename`.
- **Conventions from `apps/web-app/AGENTS.md` + repo root `AGENTS.md`**:
  - Use `EmptyState` / `ErrorState` / `LoadingState` from `@/components/ui/...` for
    state UI. Not applicable here — there's no loading/empty/error state, just a row of
    chips.
  - Import path alias `@/*` → `src/*`.
  - `cn(...)` from `@/lib/utils` for className composition.
  - lucide-react only for icons.
  - Use `import type { Foo }` for type-only imports.
  - For tests inside `*.stories.*`, `no-explicit-any` is relaxed — not relevant here.
  - No comments unless asked.

## Tasks

- [ ] 1. **Lift `addImageFile` and wire all three input paths in `ChatInput.tsx`**
  - Add the `addImageFile` helper inside `ChatInput.tsx` (local to the component file —
    no separate util). Import `toast` from `@/components/ui/sonner`.
  - Initialize `attachments` in the existing `useState<ChatInputContent>({...})`.
  - Patch every inline `{ text: "...", mentions: [] }` literal inside `ChatInput.tsx`
    (search the file) to also include `attachments: []`. There are roughly 5 such
    literals.
  - Add hidden `<input type="file" ref={fileInputRef} accept="image/*" multiple />` and
    the paperclip `<Button>` next to `<SpeechBtn>`.
  - Add `onDragOver` / `onDrop` on the outer wrapper div.
  - Patch `handleSubmit` guard and post-submit reset (see Context).
  - verify: `pnpm --filter web-app check-types` and
    `pnpm --filter web-app exec vitest --project jsdom run src/components/chat/chat-input/ChatInput.component.test.tsx`
    pass (the new tests from task 4 should run here).
  - files: `apps/web-app/src/components/chat/chat-input/ChatInput.tsx`

- [ ] 2. **Create `<AttachmentPreview>` and render it inside `ChatInput.tsx`**
  - Create `apps/web-app/src/components/chat/chat-input/AttachmentPreview.tsx` with the
    component spec from Context.
  - In `ChatInput.tsx`, render `<AttachmentPreview attachments={...} onRemove={...} />`
    between the editor and the bottom action row (or wherever visually fits — see the
    current layout at `ChatInput.tsx:178-258` for anchoring).
  - verify: `pnpm --filter web-app exec vitest --project jsdom run src/components/chat/chat-input/ChatInput.component.test.tsx`
    — the "renders a chip per attachment" test passes.
  - files: `apps/web-app/src/components/chat/chat-input/AttachmentPreview.tsx`,
    `apps/web-app/src/components/chat/chat-input/ChatInput.tsx`

- [ ] 3. **Intercept image paste in `ChatInputEditor.tsx`**
  - Pass a new prop `onAddFiles?: (files: File[]) => void` from `ChatInput.tsx` (which
    calls `addImageFile` per file in the array).
  - In `useEditor`, add `editorProps.handlePaste(view, event)`. If
    `event.clipboardData?.items` contains any `file` item, build a `File[]` via
    `item.kind === "file" ? [item.getAsFile()] : []`, call `props.onAddFiles(files)`,
    and `return true` to suppress TipTap's default paste.
  - If no image files, `return false` to keep normal text paste behavior.
  - verify: `pnpm --filter web-app check-types` passes; manual Storybook check that
    pasting text into the editor still works (run `pnpm --filter web-app storybook`).
  - files: `apps/web-app/src/components/chat/chat-input/ChatInputEditor.tsx`,
    `apps/web-app/src/components/chat/chat-input/ChatInput.tsx`

- [ ] 4. **Add component + buildParts tests**
  - Extend `ChatInput.component.test.tsx` with the four cases in Context.
  - Add `useMessages.test.ts` with one `buildParts` test that takes a content with one
    `attachments` entry and asserts the last element of the returned array is
    `{ type: "file", mime: "image/png", url: "data:image/png;base64,AAA",
   filename: "x.png" }`.
  - verify:
    `pnpm --filter web-app exec vitest --project jsdom run src/components/chat src/hooks/queries/useMessages`
    passes.
  - files:
    `apps/web-app/src/components/chat/chat-input/ChatInput.component.test.tsx`,
    `apps/web-app/src/hooks/queries/useMessages.test.ts`

- [ ] 5. **Add `WithAttachment` Storybook story**
  - Extend `ChatInput.stories.tsx` with a new export `WithAttachment` that renders
    `ChatInput` pre-seeded with one `ImageAttachment` (use a 1×1 PNG data URL).
  - verify: `pnpm --filter web-app storybook` opens and the `WithAttachment` story shows
    the chip; `pnpm --filter web-app check-types` passes.
  - files:
    `apps/web-app/src/components/chat/chat-input/ChatInput.stories.tsx`

- [ ] 6. **Full pre-commit checks**
  - verify: `pnpm --filter web-app lint && pnpm --filter web-app check-types &&
pnpm --filter web-app exec vitest --project jsdom run` — all green.
  - files: —

## Done when

- [ ] User can paste an image into the editor → it appears as a chip
- [ ] User can drag-and-drop an image file onto the input bar → chip appears
- [ ] User can click the paperclip button → file picker opens → selected images become chips
- [ ] Picking a non-image file (e.g. PDF) does NOT add a chip and shows a toast
- [ ] Adding a 6th image shows a toast and keeps the count at 5
- [ ] Clicking the `<X>` on a chip removes it
- [ ] Submitting with text + images sends both and clears both
- [ ] Submitting with images only (empty text) sends the images
- [ ] `pnpm --filter web-app lint` and `pnpm --filter web-app check-types` clean
- [ ] New component + buildParts tests pass
- [ ] Storybook `WithAttachment` renders the chip

## Notes for implementer

- Don't add a size cap (in MB). The user explicitly opted out of size limiting in
  planning. If you find yourself adding one, stop and ask.
- The cap of **5 attachments per message** IS in scope (UX safeguard). Implement it in
  `addImageFile`.
- Don't introduce a global `document` drop handler. Upstream opencode uses one and it's a
  recurring source of UX bugs (drags over unrelated areas still register). Keep the drop
  handler scoped to the input-bar wrapper.
- If TipTap's paste handler still inserts something (e.g. the `<img src="data:...">` tag
  itself), the `handlePaste` must `return true` for any image file present, even if the
  text clipboard also has plain text. Prefer images over text in that case.
- Do not commit. The user commits when ready.
- After finishing, update this plan's `status: implemented` if the user signals they're
  done, or open a follow-up plan if issues surface.
