---
name: scaffold-cloudy-desk-node
description: Scaffold a new desk node type in the cloudy web-app's React Flow canvas (apps/web-app/src/features/desk/nodes). Use this whenever the user wants to add a new node kind to the desk canvas, register a new node type, create a chat-node/sticky-note/text-node/todo-node-style node, or extend the NodeTemplate registry. Trigger phrases include "add a desk node", "create a node type", "scaffold a node", "make a new node for the canvas", "add a node to the desk", or any mention of files like `meta.ts`, `*Node.tsx`, or `nodeTemplates` under `desk/nodes/implementations/`. Do not use this for tab types, backend features, or non-canvas UI components.
---

# Scaffold a new desk node type

This skill is **instruction-only** — there is no script. You (the agent) gather a few
parameters from the user, then write the boilerplate files by hand and register the node
in the registry. The repo is under git, so no `.bak` backups are needed; if a scaffold
goes wrong the user can `git restore`.

Every node follows the same pattern: a folder under `implementations/<name>/` with
`meta.ts` (the `NodeTemplate` definition), a `<Name>Node.tsx` React Flow component,
optionally a `<Name>CreateDialog.tsx`, and an `index.ts` barrel. Adding the template to
`template/index.ts`'s `nodeTemplates` array is all the wiring needed — the sidebar picks it
up automatically and `nodeTypes` is derived.

## Step-by-step

### 1. Gather the parameters

Have a short conversation with the user to collect these.

#### `name` (required)

The folder name and the React Flow `node.type` literal. Must be kebab-case (`chat`,
`sticky-note`, `mermaid-node`). Lowercase letters/digits, hyphen-separated. Reject anything
that doesn't match `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/`.

**Important — keep these in sync (all derived from `name`):**

| Place | Value | Example (name = `image`) |
| --- | --- | --- |
| Folder | `<name>` | `image/` |
| `meta.ts` `id` | `"<name>"` | `"image"` |
| `Node<..., "name">` generic literal | `"<name>"` | `Node<{ src: string }, "image">` |
| Node file | `<Name>Node.tsx` (PascalCase) | `ImageNode.tsx` |
| Node component | `<Name>Node` | `ImageNode` |
| Dialog file (if any) | `<Name>CreateDialog.tsx` | `ImageCreateDialog.tsx` |
| Dialog component | `<Name>CreateDialog` | `ImageCreateDialog` |
| Template export | `<camelName>Template` | `imageTemplate` |

`<Name>` = PascalCase of `name` (`image` → `Image`, `sticky-note` → `StickyNote`).
`<camelName>` = camelCase of `name` (`image` → `image`, `sticky-note` → `stickyNote`).

If a tab type with the same name exists (e.g., the user wants a `chat` node when there's a
`chat` tab), that's fine — they're independent folders and registries.

#### `label` (required)

The display string shown next to the icon in `NodeDrawerSidebar` (e.g. `"Chat"`,
`"Sticky Note"`, `"Image"`).

#### `icon` (required)

A named export from `lucide-react` (e.g. `MessageSquareIcon`, `StickyNoteIcon`,
`ImageIcon`, `ListChecks`). The user picks this — do not validate. If unsure, point them
to https://lucide.dev/icons/. Note that some lucide exports end in `Icon` (e.g.
`MessageSquareIcon`) and some don't (e.g. `ListChecks`, `Type`) — the user should match the
exact export name. Surfaces at typecheck time if wrong.

#### `frame` (required)

Which shared frame wrapper to use. Explain the two options:

| Frame | When to use | Looks like |
| --- | --- | --- |
| `window` (`WindowFrame`) | "App-like" nodes — chat, todo, sticky note, mermaid. The header (title, actions, close button) is always visible. | A floating window with a title bar. |
| `frameless` (`FramelessNode`) | "Content-only" nodes — text, image. The chrome appears only when the node is selected; otherwise the content floats bare on the canvas. | Bare content; header and resize handles fade in on selection. |

If unsure, recommend `window` — most nodes are app-like.

#### `size` (required)

The initial `{ width, height }` of the node when first added. Reasonable defaults: small
content ~`{200, 150}`, medium ~`{300, 250}`, large/complex ~`{400, 600}`. The user picks
based on what they intend to render.

#### `resizeBounds` (required)

The `{ min: { width, height }, max: { width, height } }` clamp passed to the frame wrapper.
Sensible defaults: `min: { 300, 200 }`, `max: { 800, 600 }`. If the user has no opinion,
use those.

#### `dataFields` (required)

The shape of the node's `data`. Ask the user for each field: name, TypeScript type, and
whether it's optional. Build a list of `{ name, type, optional }`.

Examples:
- `[{ name: "src", type: "string", optional: true }, { name: "alt", type: "string", optional: true }]`
- `[{ name: "label", type: "string", optional: true }, { name: "color", type: '"yellow" | "pink" | "green"', optional: true }]`
- `[{ name: "items", type: "TodoItem[]", optional: false }]`

If unsure, suggest starting with all-optional fields — it's the most permissive and the
component can fall back to `??` defaults.

#### `initStrategy` (required)

How nodes of this type get their initial data when added from the sidebar. Explain the
three options:

| Strategy | When to use | What `meta.ts` gets | Example in repo |
| --- | --- | --- | --- |
| `optional` | All fields are optional; the component reads with `??` fallbacks. | Neither `configDialog` nor `defaultData`. The sidebar button adds immediately with no data. | sticky-note, text-node, mermaid-node |
| `defaultData` | The node has required fields but no user input is needed to fill them. | `defaultData: { ... }` with concrete values for every required field. | todo-node (`defaultData: { items: [] }`) |
| `dialog` | Adding the node needs user input first (pick a workspace, choose a session, enter a URL). | `configDialog: <Name>CreateDialog` + a co-located `<Name>CreateDialog.tsx`. | chat-node |

**Validation rule:** if `initStrategy === "optional"`, all `dataFields` must have
`optional: true`. Required fields need either `defaultData` or a `dialog` to supply them.

If unsure, recommend `optional` — it's the lowest-friction and the user can switch later.

#### `defaultData` (required when `initStrategy === "defaultData"`)

An object literal with concrete initial values for every required field. Keys must match
`dataFields` names. Example for `dataFields: [{name: "items", type: "TodoItem[]"}]`:
`defaultData: { items: [] }`.

### 2. Create the files

Create `apps/web-app/src/features/desk/nodes/implementations/<name>/` with these files.
Write them yourself — copy the inline skeletons below and substitute the gathered params.

> Read an existing implementation first (e.g. `implementations/text-node/` or
> `implementations/sticky-note/`) to match current conventions exactly. The skeletons here
> are the canonical starting point but the live repo is the source of truth.

#### `meta.ts` — the NodeTemplate

```ts
import { {{icon}} } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { {{Name}}Node } from "./{{Name}}Node";
// only when initStrategy === "dialog":
import { {{Name}}CreateDialog } from "./{{Name}}CreateDialog";

export const {{camelName}}Template: NodeTemplate = {
  id: "{{name}}",
  label: "{{label}}",
  icon: {{icon}},
  size: { width: {{size.width}}, height: {{size.height}} },
  // only when initStrategy === "dialog":
  configDialog: {{Name}}CreateDialog,
  // only when initStrategy === "defaultData":
  defaultData: { /* concrete values for required fields */ },
  component: {{Name}}Node,
};
```

Drop the `configDialog` line if `initStrategy !== "dialog"`; drop the `defaultData` line if
`initStrategy !== "defaultData"`; drop the dialog import accordingly.

#### `<Name>Node.tsx` — the React Flow node component (placeholder body; implement in step 4)

```tsx
import type { Node, NodeProps } from "@xyflow/react";
import { FramelessNode } from "../FramelessNode"; // or WindowFrame from "../WindowFrame"

type {{Name}}NodeProps = Node<
  {
    // one line per dataField, e.g.:
    src: string;
    alt?: string;
  },
  "{{name}}"
>;

export function {{Name}}Node({ data, id, selected }: NodeProps<{{Name}}NodeProps>) {
  return (
    <FramelessNode // or WindowFrame
      nodeId={id}
      selected={selected}
      title="{{label}}"
      minWidth={{resizeBounds.min.width}}
      minHeight={{resizeBounds.min.height}}
      maxWidth={{resizeBounds.max.width}}
      maxHeight={{resizeBounds.max.height}}
    >
      {/* TODO step 4: implement real UI. The frame's body wrapper already applies
          nodrag/nopan/nowheel — only add those classes yourself if you bypass the frame. */}
      <div className="p-2 text-xs text-muted-foreground">
        <pre className="whitespace-pre-wrap break-all">{JSON.stringify(data)}</pre>
      </div>
    </FramelessNode>
  );
}
```

Frame-specific props differ:

- **`WindowFrame`** takes `title` (rendered in the always-visible header), plus optional
  `headerActions`, `minWidth`/`minHeight`/`maxWidth`/`maxHeight`. See
  `implementations/WindowFrame.tsx` for the exact props and an existing node like
  `sticky-note` for usage.
- **`FramelessNode`** takes `title` (rendered only when selected), optional `toolbar`
  (rendered above the node when selected), and the same min/max size props. See
  `implementations/FramelessNode.tsx` and `text-node` for usage.

#### `<Name>CreateDialog.tsx` — only when `initStrategy === "dialog"` (placeholder; implement in step 4)

```tsx
import type { ConfigDialogProps } from "../../template";
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
  onSubmit,
}: ConfigDialogProps) {
  const handleAdd = () => {
    // TODO step 4: gather form state and pass to onSubmit. The object becomes the
    // new node's `data`. Example: onSubmit({ src });
    onSubmit();
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
          <Button onClick={handleAdd}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

`ConfigDialogProps` = `{ open, onOpenChange, onSubmit }` from `template/nodeTemplates.ts`.
`onSubmit(data)` — the object you pass becomes the new node's initial `data`.

#### `index.ts` — barrel

```ts
export * from "./{{Name}}Node";
export * from "./meta";
// only when initStrategy === "dialog":
export * from "./{{Name}}CreateDialog";
```

### 3. Register in `template/index.ts`

Edit `apps/web-app/src/features/desk/nodes/template/index.ts`:

1. Add an import line at the top alongside the other template imports:
   ```ts
   import { {{camelName}}Template } from "../implementations/{{name}}";
   ```
2. Append `{{camelName}}Template,` to the `nodeTemplates` array.

That's the only wiring — from `nodeTemplates` the canvas derives `nodeTypes` (the
`{ [id]: component }` map passed to `<ReactFlow nodeTypes={...}>`) and the sidebar list.

No `.bak` files. The repo is under git; if anything goes wrong the user restores via git.

### 4. Implement the node body

Do **not** stop at the placeholder — the `<Name>Node.tsx` skeleton only dumps `data` as
JSON with `// TODO` markers. Replace the placeholder with real UI right away. Ask the user
what they want the node to show/edit (e.g. "image node should show the picture and have an
edit-URL button"), then implement it.

Required for most nodes:

1. Read the generated `<Name>Node.tsx` and the surrounding `WindowFrame` (or
   `FramelessNode`) to see what props the frame already wires (`nodrag`/`nopan`/`nowheel`,
   header actions, resize bounds).
2. Add `import { useReactFlow } from "@xyflow/react"` + `const { updateNodeData } =
   useReactFlow()` if the node needs to mutate its own `data` (see [How data mutation
   works](#how-data-mutation-works-mention-this-to-the-user)). The skeleton omits it on
   purpose so it passes lint without changes.
3. Replace the JSON `<pre>` with the actual render. Reference existing implementations:
   `implementations/sticky-note/StickyNoteNode.tsx` (debounced text input + color picker in
   header), `implementations/text-node/TextNode.tsx` (frameless + TipTap editor),
   `implementations/todo-node/TodoNode.tsx` (defaultData list).
4. If `initStrategy === "dialog"`, also implement `<Name>CreateDialog.tsx` — wire the form
   fields and pass the gathered values to `onSubmit({ ... })` (the object becomes the new
   node's `data`). Use `react-hook-form` + `zod` if the shape is non-trivial; otherwise
   plain `useState` is fine.
5. For text inputs that should debounce writes (like sticky-note / text-node), use
   `lodash-es`'s `debounce(500)` + `useState` mirror + cancel-on-unmount. Copy the pattern
   from `StickyNoteNode.tsx` rather than reinventing it.

If the user is unsure what UI they want, ask 1–2 clarifying questions before implementing —
don't guess on a node with many possible shapes (e.g. "should the image node support
upload, paste-URL, or drag-drop?").

### 5. Verify

Run from the repo root:

```bash
pnpm --filter web-app check-types && pnpm --filter web-app lint
```

Both must pass. If `check-types` fails, it's almost always one of:

- **Wrong `icon` name** — `lucide-react` doesn't export what the user typed. Ask them to
  double-check at https://lucide.dev/icons/.
- **`Node<..., "id">` literal mismatch** — the three coupled places (folder, `meta.ts` `id`,
  `Node<..., "id">` generic) drifted. Re-sync them; see the table in step 1.
- **Wrong `dataFields` type** — e.g. you referenced a type that isn't imported.
- **Unescaped entity in JSX text** — if your implementation puts literal `"` / `'` / `<`
  inside `<span>...</span>`, lint flags it. Escape with `&quot;` / `&ldquo;` or wrap in
  `{"..."}`.

If `lint` fails after the Implement step, it's usually: an unused import (remove anything
you stopped using), an unescaped entity (above), or a missing `nodrag` class on an
interactive element (the frame already wraps children with `nodrag`/`nopan`/`nowheel`, so
you only need the class if you bypass the frame or mount a portal).

Report pass/fail to the user. If something fails and the user doesn't want to fix it, roll
back with `git restore` (and `rm -rf` the new folder).

### 6. Hand off

After scaffold + implement + verify, summarize for the user:

- The list of files created/edited.
- What the node now does (one line — e.g. "image node shows the picture and has an
  edit-URL button in the header").
- Anything the user should test manually in `pnpm run dev` (drag the node onto the canvas,
  resize, edit, reload to confirm `flowStore` persistence).

Do not leave TODOs behind — if you couldn't fully implement (e.g. user wants file upload
but no endpoint exists yet), say so explicitly and open a follow-up item.

## Files explained

Read this section before writing so you know what each file is for.

### `implementations/<name>/meta.ts`

The **node template registration**. Exports a `NodeTemplate` object consumed by
`template/index.ts`. Fields:

- `id` — the React Flow `node.type` literal (matches the folder name + the
  `Node<..., "id">` generic). Must be unique across all node types.
- `label` — text shown next to the icon in `NodeDrawerSidebar`.
- `icon` — `lucide-react` component reference.
- `size` — initial `{ width, height }` when the node is first dropped onto the canvas.
- `component` — the React Flow node renderer (the `<Name>Node.tsx` component).
- `configDialog` *(only when `initStrategy === "dialog"`)* — modal shown before the node is
  added; the values it passes to `onSubmit(...)` become the node's initial `data`.
- `defaultData` *(only when `initStrategy === "defaultData"`)* — static initial `data` used
  when the node is added with no dialog.

You normally don't edit this after scaffold unless: you want to reuse an external dialog
(e.g. the `chat-node` reuses `@/features/chat/components/`), change the default size, or
swap the icon.

### `implementations/<name>/<Name>Node.tsx`

The **React Flow node component**. Receives `NodeProps` (`id`, `data`, `selected`, …) and
renders inside a frame (`WindowFrame` or `FramelessNode`).

Type signature:

```ts
type {{Name}}NodeProps = Node<{ /* dataFields */ }, "{{name}}">;
```

The second generic arg **must** match `meta.ts`'s `id` and the folder name — keep them in
sync.

The skeleton does **not** import `useReactFlow` by default (would be an unused import and
fail lint). Add it in step 4 when you need to mutate data:

```tsx
import { useReactFlow } from "@xyflow/react";
// ...
const { updateNodeData } = useReactFlow();
updateNodeData(id, { /* partial data */ });
```

### `implementations/<name>/<Name>CreateDialog.tsx` (only when `initStrategy === "dialog"`)

The **modal shown before the node is added**. Receives `ConfigDialogProps` (`open`,
`onOpenChange`, `onSubmit`). Wire your form fields (use `react-hook-form` + `zod` if the
shape is non-trivial) and pass the gathered values to `onSubmit(...)` — the object becomes
the new node's initial `data`.

### `implementations/<name>/index.ts`

Barrel: `export * from "./<Name>Node"; export * from "./meta";` (+ dialog if present).
Exists so `template/index.ts` can import the whole template in one line. You almost never
edit this; if you add a sibling file you want exported, append a line.

### `template/index.ts` (the registry)

From `nodeTemplates` the canvas derives:

- `nodeTypes` — `{ [id]: component }` map passed to `<ReactFlow nodeTypes={...}>`.
- the sidebar list — each template becomes a draggable button.

Edit it by hand: one import line + one entry in the array. No backup file — git covers it.

## How data mutation works (mention this to the user)

The skeleton `<Name>Node.tsx` does **not** import `useReactFlow` by default — that would be
an unused import and fail lint. Add it when the node needs to mutate its own `data`:

```tsx
import { useReactFlow } from "@xyflow/react";
// ...
const { updateNodeData } = useReactFlow();
updateNodeData(id, { /* partial data */ });
```

For text-input nodes that should debounce writes (like sticky-note and text-node do),
recommend the `lodash-es` `debounce(500)` pattern after the basics work — the existing
implementations are good references.

## What the skill deliberately does NOT do

- It does not write tests or Storybook stories — do these as a follow-up if the user asks.
- It does not edit `DeskCanvas.tsx`, `NodeDrawerSidebar.tsx`, `flowStore.ts`, or
  `nodeTemplates.ts` (the interface) — the registry pattern means none of those need
  touching.
- It does not validate that the `icon` exists in `lucide-react` — that surfaces at
  typecheck time.
- It does not handle the `chat-node` pattern of importing a dialog from outside the desk
  feature (e.g. from `@/features/chat/components/`) — the dialog is always co-located in
  the node folder. If the user wants to reuse an existing dialog, edit `meta.ts` after
  scaffolding.
- It does not write `.bak` backups — the repo is under git.

Keep these guardrails in mind when the user asks for "just one more thing" — most of those
requests are better done as a normal edit after scaffolding + implementing, not baked into
the skill.
