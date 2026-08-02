---
name: plan-generator
description: Generate a markdown implementation plan to <repo>/plans/ from the current conversation, so a fresh AI session with zero context can pick it up and execute it. Use this whenever the user wants to capture a coding task as a plan for handoff to another session, mentions "plan", "สร้าง plan", "แผน", "implementation plan", "handoff plan", "write this up as a plan", "/plan", "save this as a plan", "document the approach", or "write this up so another agent can do it". The plan covers single-file (or 1-2 tightly-coupled files) edit scope; for larger work, help the user split into multiple plans.
---

# Generate a handoff plan

This skill turns the current conversation into a structured markdown plan that a fresh AI
session — one with zero context about how we got here — can pick up and execute. The plan
lives in the repo at `plans/<YYYYMMDD-slug>.md`, so it's tracked in git, sortable by date,
and easy to mention by slug.

The scope is deliberately **small**: a single target file (or 1-2 tightly-coupled files).
This is the unit of work that survives context loss cleanly. If the user is describing
something larger, help them split it: each chunk becomes its own plan. Plans compose.

## Why a plan instead of just doing the work

In a single session, the model already knows everything it needs. The moment you hand off
to a *different* session, that knowledge evaporates. A plan is the artifact that carries
the load-bearing context across the gap. The trick is writing down only what the new
session genuinely cannot reconstruct on its own — file paths, conventions, non-obvious
decisions, the *why* behind a choice. Everything else is noise.

## Workflow

### 1. Gather parameters (in this order)

Have a short back-and-forth with the user. Most of these are already implicit in the
conversation; surface them and confirm.

#### `title` (required — ask first)

A human-readable name for the plan. ≤60 chars. This is what gets mentioned in chat and
matched when the user later says "implement plan 'add-soft-delete'". Example:
`"Add soft-delete to Memory domain"`.

#### `slug` (derived from title)

Kebab-case of `title`: lowercase letters/digits/hyphens only. Strip punctuation, collapse
spaces. Example: `Add soft-delete to Memory domain!` → `add-soft-delete-to-memory-domain`.
Truncate to ~60 chars if longer. If the slug would collide with an existing file in
`plans/`, ask the user to disambiguate the title.

#### `target` (required)

The file(s) the plan modifies or creates. Repo-relative paths
(e.g. `packages/server/src/features/memory/service.ts`). Action per file is one of `edit`,
`create`, `delete`. For 1-2 tightly-coupled files, list each on its own row in the File map
section of the template.

#### `why` (required)

2-3 sentences explaining what's broken / missing / wanted, and the outcome the user wants.
Do not reference "the conversation" — the plan must stand alone.

#### `acceptance` (required)

A short list of observable outcomes — what must be true for the plan to count as done. Not
"task completed" (that's a task); prefer runnable checks: "running
`pnpm --filter @repo/server test` passes" or "the GET /api/memory/:id route returns 404
for soft-deleted rows". 2-4 items is right for single-file scope.

#### `context` (the most important field)

This is what keeps a fresh session from flailing. Capture anything non-obvious a new
session would have to rediscover:

- Relevant existing code, with `file:line` anchors so the implementer can jump straight
  there instead of grepping
- Conventions the change must respect (e.g. "repositories throw plain `Error`, services
  throw `HTTPException`" — pull these from the repo's `AGENTS.md` rather than inventing)
- Decisions already made and *why* (e.g. "we chose soft-delete over hard-delete because the
  audit table references these rows")
- Gotchas (e.g. "PGlite is WASM-only — don't reach for a raw pg client")

If you'd be tempted to write this in a chat message to a coworker before handing them the
task, it belongs here. Empty context = useless plan.

#### `tasks` (required)

An ordered list of atomic steps. Each task has:

- **do** — one sentence of action
- **verify** — a runnable command or a one-line assertion the implementer executes to know
  the task is done. If you can't write a verify, the task is too vague — split it.
- **files** — which target file(s) this task touches

Order tasks so each one leaves the repo in a working state (compiles, tests pass) where
possible. That way the implementer can stop after any task and not leave the build red.

#### `notes` (optional)

Warnings the implementer should respect: "no comments unless asked", "match existing
camelCase", "run `pnpm run lint` before finishing". Pull from the repo's `AGENTS.md`
rather than inventing.

### 2. Draft the plan

Fill in `templates/plan.template.md`. Substitute the gathered parameters. Drop unused
sections rather than leaving placeholder text. Read `examples/example.md` first if the
template alone is ambiguous — a worked example is worth a thousand schema descriptions.

### 3. Run the checklist

Before writing, walk through `checklist.md` against the draft. Every box must pass. If a
task has no runnable verify, fix the task. If the context section is empty, the plan will
fail at handoff — go back and fill it.

### 4. Write the plan

Write to `<repo-root>/plans/<YYYYMMDD>-<slug>.md`, where `YYYYMMDD` is today's date. If the
`plans/` directory doesn't exist, create it.

After writing, give the user the path and the exact phrase to paste into a fresh session:

> Plan written: `plans/20260802-add-soft-delete-memory.md`
> To hand off, open a new session and paste:
> `read plans/20260802-add-soft-delete-memory.md and implement it`

That's the whole handoff mechanism — no automation, no registry, no index to maintain. The
slug in the filename is the handle.

## Scope guardrails

If the user describes work spanning more than ~2 files, multiple features, or many tasks
(>8 ish), **stop and split**. Propose 2+ plans with clear boundaries. Explain that
single-file plans survive handoff far better than mega-plans — the implementer can focus,
verify incrementally, and the plan stays editable as understanding evolves.

If the user pushes back ("no, I want it all in one plan"), do it — but flag the risk
explicitly in the plan's Notes section so the implementer knows what they're walking into.

## What this skill deliberately does NOT do

- **Does not implement.** The skill writes the plan; a different session executes it. If
  the user asks the same session to implement, drop out of the skill and treat it as a
  normal edit task.
- **Does not run tests or lint.** Those go in the plan's verify steps for the implementer.
- **Does not maintain an index.** Filenames are sortable by date and grep-able by slug;
  that's enough at this scale. (If the repo grows hundreds of plans, revisit.)
- **Does not write `.bak` backups.** The repo is under git.
- **Does not commit.** The user commits when they're ready.

## Files

- `templates/plan.template.md` — the canonical skeleton. Copy it verbatim, substitute
  fields, drop unused sections.
- `examples/example.md` — one fully-worked example (a real feature plan). Read it if the
  template alone is ambiguous.
- `checklist.md` — the handoff-readiness gates. Every box must pass before writing the plan.
