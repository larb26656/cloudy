# AGENTS.md

Guide for AI coding agents working in this repository. Read this before making changes.

## Repository Overview

`cloudy` is a pnpm + Turborepo monorepo: a bundled CLI server (Hono) plus React frontends,
sharing a Drizzle/PGlite database and type-safe API contracts.

```
apps/
  server/        `cloudy` CLI binary — bundles @repo/server via tsup (host 4122)
  web-app/       React 19 + Vite + TanStack Router frontend (dev port 3001) — the web UI
packages/
  contracts/     Type-only facade re-exporting @repo/server types for the browser
  database/      Drizzle ORM + PGlite (WASM Postgres); schema, migrations, test-utils
  server/        Hono app library — routes, services, repositories; has vitest tests
  eslint-config/ Shared ESLint flat configs: base, next-js, react-internal
  typescript-config/  Shared tsconfig bases: base, vite-react, react-library, nextjs
scripts/         copy-assets.ts, generate-package.ts (scaffolds new packages)
```

Package naming: apps use their folder `name` (`server`, `web-app`); libraries use `@repo/<name>`
(`@repo/server`, `@repo/database`, `@repo/contracts`). Depend on workspace packages via
`"@repo/x": "workspace:*"`.

## Build / Lint / Typecheck / Test

All commands run from the repo root unless noted. Turborepo orchestrates and caches.

### Common (root)

```sh
pnpm install
pnpm run dev              # dev all apps concurrently (server 4122, web-app 3001)
pnpm run build            # turbo run build (all)
pnpm build:full           # build + copy-assets (drizzle migrations + web assets into dist/)
pnpm run lint             # turbo run lint (all packages)
pnpm run check-types      # turbo run check-types (all packages)
pnpm run format           # prettier --write "**/*.{ts,tsx,md}" (no .prettierrc — defaults)
```

### Targeting a single package

Use `pnpm --filter <name>` (e.g. `pnpm --filter @repo/server lint`) or `pnpm run <script> --filter=<name>`.
Scripts per package: `build`, `dev`, `lint`, `check-types`, `clean`; `@repo/server` and
`@repo/database` also have `test`, `test:ui`, `test:coverage`.

### Tests (Vitest) — `@repo/server`

The server has two vitest projects configured in `packages/server/vitest.config.ts`:

- `unit` — matches `src/**/*.test.ts`, **excludes** `*.integration.test.ts`
- `integration` — matches `src/**/*.integration.test.ts` (uses real in-memory PGlite via `createTestDb`)

```sh
pnpm --filter @repo/server test                                   # run all tests (both projects)
pnpm --filter @repo/server exec vitest run                        # same, direct
pnpm --filter @repo/server exec vitest run src/utils/date.utils.test.ts   # single FILE
pnpm --filter @repo/server exec vitest run -t "should convert Date"        # single TEST by name
pnpm --filter @repo/server exec vitest --project unit run         # only unit project
pnpm --filter @repo/server exec vitest --project integration run  # only integration project
pnpm --filter @repo/server exec vitest run --watch               # watch mode
```

Tests use `globals: true` (no need to import `describe`/`it`/`expect`, but most files import them
explicitly anyway). Mocking: `vitest-mock-extended` (`mock<T>()`, `MockProxy<T>`).

### Tests — `@repo/database`

`pnpm --filter @repo/database test` (`vitest run --pass-with-no-tests`).

### Frontend tests

`apps/web-app` has co-located `*.test.ts` files under `src/lib/` (command, message helpers).
They use vitest globals. Run from that app: `pnpm --filter web-app exec vitest run src/lib/command.test.ts`.
(The app's `tsconfig.json` excludes `*.test.ts(x)` from the build typegraph.)

### Database migrations

Migrations live in `packages/database/drizzle/`. After editing schema in
`packages/database/src/schema/*.ts`:

```sh
pnpm --filter @repo/database db:generate   # drizzle-kit generate
pnpm --filter @repo/database db:studio     # drizzle-kit studio (inspect data)
```

## Code Style

- **Language:** TypeScript strict mode everywhere (`packages/typescript-config/base.json`):
  `strict`, `noUncheckedIndexedAccess` (server/db; disabled in `web-app`), `noUnusedLocals`,
  `noUnusedParameters`. Target ES2022/ES2023, `module: ESNext`, `moduleResolution: Bundler`.
- **Modules:** ESM only (`"type": "module"`). Use ESM `import`/`export`, no `require`/CommonJS.
- **Type-only imports:** `verbatimModuleSyntax` is on for the frontend; always use
  `import type { Foo }` for types/values imported only for their type, even in backend code.
- **Formatting:** Prettier with default config (no `.prettierrc`). Run `pnpm run format`.
  Match the indentation/semicolons already present in the file you are editing (style is not
  fully uniform across legacy files).
- **No comments unless asked.** When you do comment, prefer JSDoc on exported APIs
  (see `packages/database/src/test-utils.ts`, `packages/contracts/src/index.ts` for style).
- **Naming:** `camelCase` for functions/variables, `PascalCase` for classes/types/interfaces/components,
  `kebab-case` only for generated/lowercase file names. Service classes end in `Service`
  (`MemoryService`), repositories in `Repository`. Route factory functions: `createXxxApp`.
- **Validation & types:** Define request/response shapes with **Zod** in a feature's `model.ts`,
  then derive TS types via `z.infer` / `z.input`. Never hand-write parallel DTO types.

## Backend conventions (`packages/server`)

Each feature lives in `packages/server/src/features/<feature>/` with a consistent layout:

| File                    | Responsibility                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `model.ts`              | `XxxModel = { dtoSchema, querySchema, createSchema, updateSchema }` (Zod) + exported `type XxxDto / XxxQuery / CreateXxxInput / UpdateXxxInput`.                                                            |
| `repository.ts`         | `class XxxRepository { constructor(private db: AppDatabase) {} }` — Drizzle queries only. Maps DB rows → DTOs. Throws plain `Error` on internal failures (e.g. insert failed).                              |
| `service.ts`            | `class XxxService { constructor(private repository: XxxRepository) {} }` — business logic. Throws `HTTPException` from `hono/http-exception` with an HTTP `status` (404 when entity missing) and a message. |
| `index.ts`              | `export function createXxxApp({ xxxService })` — returns a `new Hono()` sub-app. Use `hono-openapi`'s `describeRoute(...)`, `validator('query'                                                              | 'json', schema)`, and `resolver(schema)` on each route for OpenAPI docs. |
| `*.test.ts`             | Unit test for the service (mock the repository).                                                                                                                                                            |
| `*.integration.test.ts` | Integration test hitting the Hono app backed by an in-memory PGlite DB.                                                                                                                                     |

**Wiring:** manual DI via `packages/server/src/container.ts` — `initContainer(config)` constructs
all DB client + repositories + services as module-level singletons. Compose route sub-apps in
`packages/server/src/server.ts` (`createApp`) under `/api/<feature>`; also wires CORS, `/api/health`,
`/openapi`, and `/docs`. `export type AppType = ReturnType<typeof createApp>`.

**Frontend ↔ backend contract:** `@repo/contracts` re-exports `AppType` **type-only** so the browser
never bundles Node-only server code. Frontend calls the API via `hono/client`:
`hc<AppType>(url)` (see `apps/web-app/src/lib/api.ts`). **Never** add a value (runtime) export
to `@repo/contracts` — only `export type`.

## Database conventions (`packages/database`)

- Define tables with Drizzle's `pgTable` in `src/schema/<entity>.ts`; re-export from
  `src/schema/index.ts`. Export `type FooRecord = typeof foo.$inferSelect` and `type NewFoo`.
- PGlite (WASM Postgres) only — no external Postgres server. `DbClient` (`src/client.ts`) owns the
  connection; `runMigrations(dbPath)` applies the SQL in `drizzle/`.
- Tests use `createTestDb()` / `closeTestDb(db)` from `src/test-utils.ts` (in-memory PGlite +
  migrations applied). Import via `import { createTestDb } from "@repo/database"`.

## Frontend conventions (`apps/web-app`)

- **Stack:** React 19, TanStack Router (file-based routes in `src/routes/`; route tree is
  auto-generated into `src/routeTree.gen.ts` — **never edit by hand**), TanStack Query, Zustand
  (`src/stores/`), Tailwind v4 via `@tailwindcss/vite`, shadcn/ui primitives in `src/components/ui/`.
- **Zustand selectors:** Always use individual selectors to prevent unnecessary re-renders:

  ```ts
  // ❌ Bad — causes re-render when ANY store state changes
  const { workspaces, getWorkspace } = useWorkspaceStore();

  // ✅ Good — only re-renders when `workspaces` or `getWorkspace` changes
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const getWorkspace = useWorkspaceStore((s) => s.getWorkspace);
  ```

- **Path alias:** `@/*` → `src/*` (configured in `tsconfig.json` and `vite.config.ts`).
- **Styling helper:** `cn(...)` from `src/lib/utils.ts` (`clsx` + `tailwind-merge`). Prefer it for
  conditional class composition; use `class-variance-authority` (`cva`) for component variants.
- **API client:** import `cloudyClient` from `src/lib/api.ts`; all endpoints are type-inferred.
- **API base URL:** in dev the app talks to the server at `http://127.0.0.1:4122` (no Vite proxy is
  configured in `vite.config.ts` — requests go directly to the API origin).

## Desk conventions (`apps/web-app`)

Desk is a tab type (`"desk"`) that provides a React Flow canvas for building node-based workflows.

### Architecture

- **Tab type** — defined in `src/stores/tabStore.ts` as `type: "desk"` with `DeskData = Record<string, never>`
- **Flow persistence** — `src/stores/flowStore.ts` stores flows keyed as `desk-${tabId}`: `{ nodes, edges, viewport }`
- **Canvas** — `src/features/desk/DeskCanvas.tsx` uses `@xyflow/react` (`ReactFlow`, `NodeResizer`, etc.)

### Adding a new node type

Create a new folder under `src/features/desk/nodes/implementations/<node-name>/`:

```
<node-name>/
  index.ts          — re-exports
  <NodeName>.tsx    — React component (use `NodeProps<Node<{...}, "node-id">>`)
  meta.ts           — `NodeTemplate` definition
```

**1. Component** (`<NodeName>.tsx`):

```tsx
import { NodeResizer, useReactFlow } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";

type MyNodeProps = Node<{ label?: string /* custom fields */ }, "my-node">;

export function MyNode({ data, id, selected }: NodeProps<MyNodeProps>) {
  const { deleteElements, updateNodeData } = useReactFlow();
  // render via <NodeResizer> + your UI
}
```

**2. Template** (`meta.ts`):

```ts
import { SomeIcon } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { MyNode } from "./MyNode";

export const myNodeTemplate: NodeTemplate = {
  id: "my-node",
  label: "My Node",
  icon: SomeIcon,
  size: { width: 200, height: 150 }, // optional default size
  defaultData: { label: "Hello" }, // optional initial data
  component: MyNode,
};
```

**3. Register** in `src/features/desk/nodes/template/index.ts`:

```ts
import { myNodeTemplate } from "../implementations/my-node";
export const nodeTemplates: NodeTemplate[] = [
  chatTemplate,
  stickyNoteTemplate,
  mermaidTemplate,
  myNodeTemplate,
];
export const nodeTypes = nodeTemplates.reduce((acc, t) => {
  acc[t.id] = t.component;
  return acc;
}, {});
```

### Node data model

`NodeTemplate` shape:
| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique node type identifier |
| `label` | `string` | Display name in sidebar |
| `icon` | `LucideIcon` | Sidebar icon |
| `size` | `CSSProperties` | Optional default `{ width, height }` |
| `configDialog` | `ComponentType<ConfigDialogProps>` | Optional dialog before adding |
| `defaultData` | `Record<string, unknown>` | Optional initial node data |
| `component` | `ComponentType` | React Flow node component |

## Storybook conventions (`apps/web-app`)

`web-app` uses Storybook 10 with the **`@storybook/tanstack-react` framework**. This framework exposes
a type-safe authoring API — stories are written with `preview.meta(...)` / `meta.story(...)`, **not** the
classic `Meta` / `StoryObj` pattern.

### Config layout

| File                       | Role                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.storybook/main.ts`       | Framework = `@storybook/tanstack-react`. Story globs: `../src/**/*.mdx` and `../src/**/*.stories.@(js\|jsx\|mjs\|ts\|tsx)`. Addons: chromatic, vitest, a11y, docs. |
| `.storybook/preview.tsx`   | `definePreview(...)` — wires `addonDocs()`, MSW loader (`msw-storybook-addon`), and a11y config (`test: "todo"` — violations surface in UI but don't fail CI).     |
| `src/storybook/preview.ts` | One-line shim: `export { default } from "../../.storybook/preview"`. Exists so stories can import the preview via the `@/` alias.                                  |

### Authoring a story

Co-locate `<Component>.stories.tsx` next to the component. Import the preview facade via the `@/storybook/preview`
alias (preferred over a deep relative path to `.storybook/preview.tsx`):

```tsx
import preview from "@/storybook/preview";
import { MyComponent } from "./MyComponent";

const meta = preview.meta({
  title: "Category/Subcategory/MyComponent", // hierarchical; mirrors folder structure
  component: MyComponent,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    variant: { control: "select", options: ["default", "outline"] },
  },
});

export default meta;

export const Default = meta.story({ args: { variant: "default" } });
export const Outline = meta.story({ args: { variant: "outline" } });
```

Conventions:

- **Story naming:** use `meta.story({ args })` — one named export per visual state (e.g. `Default`, `Running`,
  `Error`, `Disabled`). Export names become the story titles in the sidebar.
- **`title`** is hierarchical and slash-separated, mirroring the component's location under `src/` (e.g.
  `Chat/Message/Parts/ToolComponents/BashTool`, `Permission/PermissionBanner`, `UI/ColorPicker`).
- **Controlled components** (need `value`/`onChange`, react-hook-form, etc.): wrap them in a small `XxxDemo`
  component that owns the internal state, then pass that demo as `meta.component`. See
  `src/components/ui/color-picker/ColorPicker.stories.tsx` for the pattern (a `ColorPickerDemo` wraps
  `ColorPicker` with `useState`, plus a `WithReactHookForm` story that uses a custom `render`).
- **Complex SDK/external props** (e.g. tool `state` from the opencode SDK): cast with `as any` in story `args`
  rather than building the full type — stories are for visual review, not type-checking.
- **Mocking API calls:** use the MSW loader (already wired globally). Add handlers per-story via the `msw`
  parameter; no per-story loader import needed.

### Running Storybook

```sh
pnpm --filter web-app storybook          # dev server on http://localhost:6006
pnpm --filter web-app build-storybook    # static build into storybook-static/
```

### Storybook as a test target

`apps/web-app/vitest.config.ts` defines **three** vitest projects — `node` (`*.test.ts`),
`jsdom` (`*.component.test.tsx`), and a `storybook` project. The storybook project uses
`@storybook/addon-vitest`'s `storybookTest` plugin and runs each story's interaction tests through a headless
Playwright chromium instance. So `pnpm --filter web-app test` runs storybook interaction tests too. To exercise
interactions inside a story, use `await expect(canvas).toBeInTheDocument(...)` style play functions
(documented under Storybook's interaction testing).

## Error handling

- **Services** throw `HTTPException(status, { message })` (typically `404` for missing entities).
  Do not catch-and-return error objects; let Hono translate exceptions into HTTP responses.
- **Repositories** throw plain `Error` for unexpected/internal failures; return `null`/empty results
  for "not found" so the service can decide the HTTP status.
- **Tests** assert on both the thrown type and `status`: e.g.
  `await expect(svc.get('x')).rejects.toMatchObject({ status: 404 })`.

## API Client (Frontend)

Import the typed client from `src/lib/api.ts`:

```ts
import { cloudyClient } from "@/lib/api";
// All endpoints are type-inferred; no manual DTOs needed
const result = await cloudyClient.api.xxx.get();
```

Never import runtime values from `@repo/contracts` — it is type-only.

## Imports & Module Syntax

- Use `import type { Foo }` for types used only as types (frontend: always; backend: preferred).
- ESM only — no `require()`, no CommonJS.
- Barrel files (`index.ts`) re-export from sibling modules; avoid deep relative imports across features.
- Path aliases: `@/*` maps to `src/*` in frontend apps.

## Workflow checklist

1. Make targeted, surgical edits — read the surrounding code and imports first.
2. After backend changes touching types: run `pnpm run check-types` to validate the whole graph.
3. After schema changes: run `pnpm --filter @repo/database db:generate` and commit the new SQL.
4. Always run lint + typecheck before finishing: `pnpm run lint && pnpm run check-types`.
5. Run relevant tests:
   - Unit only: `pnpm --filter @repo/server exec vitest --project unit run`
   - Integration only: `pnpm --filter @repo/server exec vitest --project integration run`
   - Single file: `pnpm --filter @repo/server exec vitest run src/path/to/file.test.ts`
   - Single test: `pnpm --filter @repo/server exec vitest run -t "test name pattern"`
6. Do not commit unless explicitly asked. Never commit `.env*`, `dist/`, or `*.tgz`.
