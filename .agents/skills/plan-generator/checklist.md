# Handoff readiness checklist

Walk through every box before writing the plan file. If any fails, fix the plan first.
The point of this list is that handoff failure is usually silent — the new session doesn't
error out, it just flails and produces bad work. These gates catch the common flail modes.

## Required fields

- [ ] `title` present, ≤60 chars
- [ ] `slug` = kebab-case of title (lowercase, hyphen-separated, no spaces)
- [ ] `id` = `YYYYMMDD-<slug>`, today's date
- [ ] `status: ready` (use `draft` only if genuinely unfinished — a draft is not handoff-ready)
- [ ] `created` date filled in

## Why / Target / Acceptance

- [ ] Why section is 2-3 sentences and self-contained (no "as we discussed")
- [ ] Target file path is repo-relative and explicit; action stated per file
- [ ] Acceptance criteria are observable (commands, HTTP responses, file contents) — not
      "task completed" or "the feature works"

## Context

- [ ] Context section has at least one specific anchor (file path, line number, or quoted
      code) — not just prose
- [ ] No reference to "the conversation" or "what we talked about" — the plan stands alone
- [ ] Conventions called out if the change touches code with non-obvious rules (check the
      repo's `AGENTS.md`)

## Tasks

- [ ] Every task has a `verify:` line
- [ ] Every verify is runnable (a shell command) or a one-line assertion (e.g. "file X
      contains line Y") — not "it works" or "looks right"
- [ ] Tasks are ordered so the repo is in a working state after each one where possible
- [ ] No task bundles multiple logical changes — split if it does

## Notes

- [ ] (Optional field.) If present, each note is actionable, not philosophical

## File

- [ ] Path is `<repo-root>/plans/<YYYYMMDD>-<slug>.md`
- [ ] No `.bak` file written — git covers rollback
