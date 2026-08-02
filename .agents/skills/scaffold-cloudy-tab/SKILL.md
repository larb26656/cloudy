---
name: scaffold-cloudy-tab
description: Scaffold a new tab type in the cloudy web-app (apps/web-app). Use this whenever the user wants to add a new tab kind to the tabbed desktop UI, register a new tab type, create a chat/desk/files/webview-style tab, or extend the TabTemplate registry. Trigger phrases include "add a new tab", "create a tab type", "scaffold a tab", "make a new tab", "add tab to the tab bar", or any mention of files like `meta.ts`, `*Content.tsx`, `*TabItem.tsx`, or `registry.ts` under `tabs/implementations/`. Do not use this for backend features, desk nodes, or non-tab UI components.
---

# Scaffold a new frontend tab

This skill is **instruction-only** — there is no script. You (the agent) gather a
few parameters from the user, then write the boilerplate files by hand and register the
tab in the registry. The repo is under git, so no `.bak` backups are needed; if a scaffold
goes wrong the user can `git restore`.

Every tab in cloudy follows the same pattern: a folder under `implementations/<name>/` with
`meta.ts` (the `TabTemplate` definition), a Content component, a TabItem component,
optionally a CreateDialog, and an `index.ts` barrel. Registering one line in
`template/registry.ts` extends the `Tab` union and `TabDataMap` types automatically — no
manual type edits required.

## Step-by-step

### 1. Gather the parameters

Have a short conversation with the user to collect these. You can ask multiple things at
once if the user is moving fast; otherwise go one at a time.

#### `name` (required)

The folder name, registry key, and `type` literal. Must be kebab-case (`terminal`,
`sticky-note`, `webview`). Lowercase letters/digits, hyphen-separated. Reject anything that
doesn't match `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/`.

**Important — keep these in sync (all derived from `name`):**

| Place | Value | Example (name = `terminal`) |
| --- | --- | --- |
| Folder | `<name>` | `terminal/` |
| `meta.ts` `type` | `"<name>"` | `"terminal"` |
| `Extract<Tab, { type: "name" }>` literal | `"<name>"` | `"terminal"` |
| Registry key in `registry.ts` | `<name>:` | `terminal: terminalTemplate,` |
| Content file | `<Name>Content.tsx` | `TerminalContent.tsx` |
| Content component | `<Name>Content` | `TerminalContent` |
| TabItem file | `<Name>TabItem.tsx` | `TerminalTabItem.tsx` |
| TabItem component | `<Name>TabItem` | `TerminalTabItem` |
| CreateDialog file (if any) | `<Name>CreateDialog.tsx` | `TerminalCreateDialog.tsx` |
| CreateDialog component | `<Name>CreateDialog` | `TerminalCreateDialog` |
| Data type | `<Name>Data` | `TerminalData` |
| Template export | `<camelName>Template` | `terminalTemplate` |

`<Name>` = PascalCase of `name` (`terminal` → `Terminal`, `sticky-note` → `StickyNote`).
`<camelName>` = camelCase of `name` (`terminal` → `terminal`, `sticky-note` → `stickyNote`).

#### `label` (required)

The display string shown in the "+" dropdown menu (e.g. `"New Chat"`, `"New Terminal"`).
Usually starts with "New ".

#### `icon` (required)

A named export from `lucide-react` (e.g. `Terminal`, `MessageCircle`, `Globe`, `PenTool`).
The user picks this — do not validate it against any list. If they're unsure, suggest they
browse https://lucide.dev/icons/. Surfaces at typecheck time if wrong.

#### `dataFields` (required)

The shape of the tab's `data`. Ask the user for each field: name, TypeScript type, and
whether it's optional. Build a list of `{ name: string, type: string, optional: boolean }`.

Examples:
- `[{ name: "name", type: "string", optional: false }]` — desk-style
- `[{ name: "url", type: "string", optional: false }, { name: "history", type: "string[]", optional: false }]` — webview-style
- `[{ name: "workspaceId", type: "string", optional: false }]` — files-style

If the user doesn't know yet, suggest `[{ name: "name", type: "string", optional: false }]`
as a starting point and tell them they can edit later.

#### `creationMode` (required)

How tabs of this type get created. Explain the three options and let the user pick:

| Mode | When to use | What `meta.ts` gets | Example in repo |
| --- | --- | --- | --- |
| `dialog` | Creating a tab needs user input first (pick a workspace, type a URL, choose a session). | `CreateDialog: <Name>CreateDialog` + a co-located `<Name>CreateDialog.tsx`. | chat, webview, files |
| `defaultData` | Click-and-go from the "+" menu, no modal. | `defaultData: { ... }` with concrete values for every required field. | desk |
| `manual` | Tabs are only ever created programmatically (from another tab, a node, a deep link). No "+" menu entry effectively. | Neither `CreateDialog` nor `defaultData`. The "+" button will still appear but do nothing useful unless you wire something up. | — |

If unsure, recommend `defaultData` — it's the simplest and gets the user a working tab
fastest.

#### `defaultData` (required when `creationMode === "defaultData"`)

An object literal with concrete initial values for every required field in `dataFields`.
Keys must match `dataFields` names. Example for `dataFields: [{name: "cwd", type: "string"}]`:
`defaultData: { cwd: "." }`.

#### `tabBarLabel` (required)

The static string the tab chip shows in the tab bar. Often the same as `label` minus the
"New " prefix (e.g. `label: "New Terminal"` → `tabBarLabel: "Terminal"`). If the user wants
the chip label to derive from `tab.data.<field>` instead, they can edit the generated
`<Name>TabItem.tsx` after the fact — the skeleton below always emits a literal string for
determinism.

### 2. Create the files

Create `apps/web-app/src/features/home/tabs/implementations/<name>/` with these files.
Write them yourself — copy the inline skeletons below and substitute the gathered params.

> Read an existing implementation first (e.g. `implementations/desk/` or
> `implementations/webview/`) to match current conventions exactly. The skeletons here are
> the canonical starting point but the live repo is the source of truth.

The skeletons use `{{var}}` placeholders you substitute by hand, and `// only when ...`
comments marking lines you drop unless the condition holds.

#### `meta.ts` — the TabTemplate + Data type

```ts
import { {{icon}} } from "lucide-react";
import type { TabTemplate } from "../../template";
import { {{Name}}Content } from "./{{Name}}Content";
import { {{Name}}TabItem } from "./{{Name}}TabItem";
// only when creationMode === "dialog":
import { {{Name}}CreateDialog } from "./{{Name}}CreateDialog";

export type {{Name}}Data = {
  // one line per dataField, e.g.:
  //   cwd: string;
  //   pid?: string | null;
{{dataFields}}
};

export const {{camelName}}Template: TabTemplate<{{Name}}Data> = {
  type: "{{name}}",
  label: "{{label}}",
  icon: {{icon}},
  TabBarComponent: {{Name}}TabItem,
  ContentComponent: {{Name}}Content,
  // only when creationMode === "dialog":
  CreateDialog: {{Name}}CreateDialog,
  // only when creationMode === "defaultData":
  defaultData: { /* concrete values for required fields */ },
};
```

Drop the `CreateDialog` line + its import if `creationMode !== "dialog"`; drop the
`defaultData` line if `creationMode !== "defaultData"`.

#### `<Name>Content.tsx` — the main-area surface (placeholder body; implement in step 4)

```tsx
import type { Tab } from "@/stores/tabStore";

interface {{Name}}ContentProps {
  tab: Extract<Tab, { type: "{{name}}" }>;
}

export function {{Name}}Content({ tab }: {{Name}}ContentProps) {
  // To update tab data: import { useTabStore } from "@/stores/tabStore" at the
  // top of this file, then:
  //   const updateTabData = useTabStore((s) => s.updateTabData);
  //   updateTabData(tab.id, { /* partial data */ });
  return (
    <div className="h-full w-full overflow-hidden p-4">
      {/* TODO step 4: implement {{Name}}Content */}
      <pre className="text-xs">{JSON.stringify(tab.data, null, 2)}</pre>
    </div>
  );
}
```

If the destructure line gets long (many props), wrap it across lines; otherwise keep
single-line.

#### `<Name>TabItem.tsx` — the tab-bar chip (usually fine as-is)

```tsx
import { {{icon}} } from "lucide-react";
import type { Tab } from "@/stores/tabStore";
import { TabItemShell } from "@/features/home/components/TabItemShell";

interface {{Name}}TabItemProps {
  tab: Extract<Tab, { type: "{{name}}" }>;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

export function {{Name}}TabItem({
  tab,
  isActive,
  onClick,
  onClose,
}: {{Name}}TabItemProps) {
  return (
    <TabItemShell
      icon={{{icon}}}
      label="{{tabBarLabel}}"
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
    />
  );
}
```

Edit only if the chip label should derive from data (like `chat` derives the session title)
— switch from the literal `{{tabBarLabel}}` to `tab.data.<field>`.

#### `<Name>CreateDialog.tsx` — only when `creationMode === "dialog"` (placeholder; implement in step 4)

```tsx
import type { CreateDialogProps } from "../../template";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function {{Name}}CreateDialog({
  open,
  onOpenChange,
}: CreateDialogProps) {
  // When your form is ready, wire it to the tab store:
  //   import { useTabStore } from "@/stores/tabStore";
  //   const addTab = useTabStore((s) => s.addTab);
  //   addTab("{{name}}", { /* {{Name}}Data */ });
  const handleSubmit = () => {
    // TODO step 4: build the {{Name}}Data payload from your form state.
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{label}}</DialogTitle>
        </DialogHeader>
        <div className="py-4">{/* TODO step 4: implement form fields */}</div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

`CreateDialogProps` = `{ open, onOpenChange }` (no `onSubmit` — the dialog itself calls
`addTab` from the tab store). Use `react-hook-form` + `zod` for non-trivial forms.

#### `index.ts` — barrel

```ts
export * from "./{{Name}}TabItem";
export * from "./{{Name}}Content";
export * from "./meta";
// only when creationMode === "dialog":
export * from "./{{Name}}CreateDialog";
```

### 3. Register in `template/registry.ts`

Edit `apps/web-app/src/features/home/tabs/template/registry.ts`:

1. Add an import line at the top alongside the other template imports:
   ```ts
   import { {{camelName}}Template } from "../implementations/{{name}}";
   ```
2. Add one key to the `templates` object:
   ```ts
   export const templates = {
     chat: chatTemplate,
     desk: deskTemplate,
     webview: webviewTemplate,
     files: filesTemplate,
     {{name}}: {{camelName}}Template,
   } as const;
   ```

That's the only wiring — from `templates` the app derives the `Tab` union, `TabDataMap`,
the "+" menu, and the tab bar. No `.bak` files; git covers rollback.

### 4. Implement the tab surface

Do **not** stop at the scaffold — the `<Name>Content.tsx` skeleton only dumps `tab.data` as
JSON with `// TODO` markers. Replace the placeholder with the real surface right away. Ask
the user what the tab should show (e.g. "terminal tab should embed xterm.js", "files tab
should show a file tree for the workspace"), then implement it.

Required for most tabs:

1. Read the generated `<Name>Content.tsx` and check sibling implementations for patterns:
   `implementations/chat/ChatContent.tsx` (data-layer-heavy), `implementations/desk/DeskContent.tsx`
   (owns its own React Flow state in `flowStore`), `implementations/webview/WebviewContent.tsx`
   (iframe + history), `implementations/files/FilesContent.tsx` (workspace-scoped list).
2. Wire data mutation via the tab store when the tab needs to update its own `data`:
   ```tsx
   import { useTabStore } from "@/stores/tabStore";
   const updateTabData = useTabStore((s) => s.updateTabData);
   updateTabData(tab.id, { /* partial {{Name}}Data */ });
   ```
   Use **individual selectors** — never destructure the whole store (it re-renders on every
   state change).
3. Server state goes through TanStack Query hooks in `src/hooks/queries/` — do **not** mirror
   server data into Zustand. Zustand is only for client-only state.
4. If `creationMode === "dialog"`, also implement `<Name>CreateDialog.tsx`: wire form fields
   and call `addTab("{{name}}", { /* {{Name}}Data */ })` from `useTabStore`. Use
   `react-hook-form` + `zod` for non-trivial forms (see `chat` and `webview` CreateDialogs
   for the pattern).
5. `<Name>TabItem.tsx` is usually fine as-is. Edit it only if the chip label should derive
   from data (like `chat` derives the session title) — switch from the literal
   `{{tabBarLabel}}` to `tab.data.<field>`.

If the user is unsure what the surface should look like, ask 1–2 clarifying questions before
implementing — don't guess on a tab with many possible shapes.

### 5. Verify

Run from the repo root:

```bash
pnpm --filter web-app check-types && pnpm --filter web-app lint
```

Both must pass. If `check-types` fails, the most likely causes are:

- **Wrong `icon` name** — `lucide-react` doesn't export it. Browse https://lucide.dev/icons/.
- **`dataFields` vs `defaultData` mismatch** — a field marked required but omitted from
  `defaultData`.
- **`type` literal drift** — the folder, `meta.ts` `type`, and `Extract<Tab, { type: "..." }>`
  literals don't match. Re-sync them; see the table in step 1.

If `lint` fails after the Implement step, it's usually: an unused import, an unescaped entity
in JSX text (escape `"` with `&quot;`), or a missing `nodrag`/`nopan` class on an interactive
element inside a desk-tab canvas.

Report pass/fail to the user. If something fails and the user doesn't want to fix it, roll
back with `git restore` (and `rm -rf` the new folder).

### 6. Hand off

After scaffold + implement + verify, summarize for the user:

- The list of files created/edited.
- What the tab now does (one line — e.g. "files tab shows a workspace-scoped file list").
- Anything the user should test manually in `pnpm run dev` (open the tab, interact, reload
  to confirm `tabStore` persistence).
- Whether the persisted `tabStore` version needs bumping (almost never — see
  [Persistence note](#persistence-note-when-to-bump-the-tab-store-version)).

Do not leave TODOs behind — if you couldn't fully implement (e.g. user wants a websocket
feature but no endpoint exists yet), say so explicitly and open a follow-up item.

## Files explained

Read this section before writing so you know what each file is for.

### `implementations/<name>/meta.ts`

The **tab template registration**. Exports the `<Name>Data` type + a `TabTemplate<<Name>Data>`
object consumed by `template/registry.ts`. Fields:

- `type` — unique key matching the folder name and the registry key. Also the literal in
  `Extract<Tab, { type: "name" }>` used by every component.
- `label` — text shown in the "+" dropdown menu.
- `icon` — `lucide-react` component reference.
- `TabBarComponent` — the chip rendered in the tab bar (the `<Name>TabItem.tsx` component).
- `ContentComponent` — the surface rendered in the main area (the `<Name>Content.tsx`
  component).
- `CreateDialog` *(only when `creationMode === "dialog"`)* — modal shown before the tab is
  added; calls `addTab("name", { ... })`.
- `defaultData` *(only when `creationMode === "defaultData"`)* — static initial `data` used
  when the tab is added with no dialog.

Adding this template to the registry auto-extends the `Tab` union and `TabDataMap` — no
manual type edits required. You normally don't edit `meta.ts` after scaffold unless you want
to change the icon or add `onClose` cleanup.

### `implementations/<name>/<Name>Content.tsx`

The **main area surface** — the rectangle of UI that fills the middle of the app when the
tab is active. Receives `{ tab: Extract<Tab, { type: "name" }> }` so `tab.data` is typed as
`<Name>Data`.

The skeleton does **not** import `useTabStore` by default (would be an unused import and fail
lint). Add it in step 4 when you need to mutate the tab's data:

```tsx
import { useTabStore } from "@/stores/tabStore";
const updateTabData = useTabStore((s) => s.updateTabData);
updateTabData(tab.id, { /* partial data */ });
```

Always use **individual selectors** — never destructure the whole store.

### `implementations/<name>/<Name>TabItem.tsx` (usually read-only)

The **tab bar chip**. Wraps `TabItemShell` with the tab's icon + a literal label. Receives
`{ tab, isActive, onClick, onClose }`. Usually fine as-is; edit only if the chip label should
derive from data (like `chat` derives the session title) — switch from the literal
`tabBarLabel` to `tab.data.<field>`.

### `implementations/<name>/<Name>CreateDialog.tsx` (only when `creationMode === "dialog"`)

The **modal shown when the user picks the tab from the "+" menu**. Receives
`CreateDialogProps` (`open`, `onOpenChange`). Wire your form fields (use `react-hook-form` +
`zod` if the shape is non-trivial) and call `addTab("name", { /* {{Name}}Data */ })` from
`useTabStore` on submit.

### `implementations/<name>/index.ts`

Barrel: re-exports `TabItem`, `Content`, `meta` (+ dialog if present). Exists so
`template/registry.ts` can import the whole template in one line. You almost never edit
this; if you add a sibling file you want exported, append a line.

### `template/registry.ts` (the registry)

From the `templates` object the app derives:

- the `Tab` union type — `type Tab = { [K in keyof typeof templates]: { type: K; data: TabDataMap[K]; ... } }[keyof typeof templates]`.
- the `TabDataMap` — `{ [K]: TabDataMap[K] }`, one entry per template.
- the "+" menu and the tab bar — they iterate `Object.values(templates)`.

Edit it by hand: one import line + one key in the object. No backup file — git covers it.

## Persistence note (when to bump the tab store version)

`useTabStore` persists tabs to `localStorage` under key `"tabs"` with a schema version
(currently `3`). For a brand-new tab type, **you usually do not need to bump the version** —
old users' localStorage simply won't contain any tabs of the new type. Only bump if your new
tab could somehow end up in old persisted state (very rare). Mention this to the user if they
ask about migrations.

## What the skill deliberately does NOT do

- It does not write tests or Storybook stories — do these as a follow-up if the user asks.
- It does not bump the `tabStore` version or add migration branches (only needed if your new
  tab could end up in old persisted state — very rare).
- It does not validate that the `icon` exists in `lucide-react` — that surfaces at typecheck
  time if wrong.
- It does not edit `tabStore.ts`, `tabTemplates.ts`, or `HomePage.tsx` — the registry pattern
  means none of those need touching.
- It does not write `.bak` backups — the repo is under git.

Keep these guardrails in mind when the user asks for "just one more thing" — most of those
requests are better done as a normal edit after scaffolding + implementing, not baked into
the skill.
