---
name: adr
description: Record an Architecture Decision Record (ADR) at `docs/adr/NNNN-slug.md` capturing a significant project decision — choosing a tech/library, deprecating an approach, a structural change, or any "we picked X over Y because Z" moment. Use when the user says "สร้าง ADR", "บันทึกการตัดสินใจนี้", "จด decision record", "record this decision", "save this decision as an ADR", "write an ADR for this", "why did we pick X", "/adr", or otherwise explicitly asks to capture a decision as an ADR. Do NOT auto-suggest; this skill only fires when the user explicitly asks to record a decision.
---

# Record an Architecture Decision Record (ADR)

Capture a significant project decision as a short markdown file under `docs/adr/`.
ADR = **why we chose X over Y**, not how to do X. The reader is a future teammate
(or a future you) who asks "wait, why is the database PGlite and not real Postgres?"
and wants a 5-minute answer with the trade-offs spelled out.

## Scope boundaries — read these first

This skill is narrowly scoped. Get the boundary right before writing anything.

**This skill records a decision. It does NOT:**
- Implement the decision. If the user wants to *do* the work, drop out of this skill
  and use `plan-generator` (or just edit code directly).
- Explain how a module works. That's `concept_generator`'s job.
- Plan a sequence of implementation steps. That's `plan-generator`'s job.
- Document an API or system surface. Use `concept_generator` or write prose.

**The decision is ADR-worthy if it has ALL of:**
1. A genuine choice existed — at least one realistic alternative was on the table.
2. The choice is load-bearing — reversing it later would be costly or annoying.
3. A future reader (human or AI) would plausibly ask "why this way?".

If only one reasonable option exists, there's no decision to record — skip the ADR.

## Workflow

### 1. Gather parameters (have a short back-and-forth with the user)

Most of these are implicit in the conversation already. Surface them and confirm.
Use the `question` tool if multiple parameters are unclear, otherwise just ask inline.

#### `title` (required)
A short imperative phrase describing the decision, not the topic.
≤60 chars. Read it back aloud — it should be a sentence.
- Good: "Use PGlite instead of an external Postgres server"
- Bad: "Database" (too vague), "Database decision" (no choice stated)

#### `slug` (derived from title)
Kebab-case of `title`: lowercase letters/digits/hyphens only. Strip punctuation,
collapse spaces. Example: `Use PGlite instead of an external Postgres server!` →
`use-pglite-instead-of-external-postgres`. Truncate to ~60 chars if longer.

#### `status` (default `accepted`)
One of:
- `proposed` — written but not yet agreed by the deciders; needs review.
- `accepted` — agreed and in force. **Default.** Use this unless told otherwise.
- `superseded` — replaced by a later ADR (set via the supersede protocol below).
- `deprecated` — no longer in force, with no direct replacement.

Ask if you're not sure. Most ADRs are written `accepted` because the user is
recording a decision already made.

#### `context` (required)
2-4 paragraphs covering:
- What problem were we trying to solve? What was the pain?
- What constraints were in play (technical, organizational, time, team)?
- What forces pushed in different directions?

**Context must talk about the PROBLEM, not the solution.** If `context` already
names what we picked, it's wrong — that goes in `decision`.

Anchor to specifics: file paths, line numbers, real incidents, real numbers.
A reader who wasn't there should be able to reconstruct the situation.

#### `decision` (required)
1-3 paragraphs stating what we chose. The first sentence must be a clear
statement starting with "We will...", "We adopt...", "We choose...".

Follow with the *brief* reason — one or two sentences, not an essay. The deep
reasoning lives in `alternatives` (why not the others) and `context` (the
problem framing).

#### `consequences` (required)
Three buckets, all required:
- **Positive** — what we gain by this choice.
- **Negative** — what we give up or accept as a cost. **At least one item.**
  A decision with no downsides is suspicious — re-examine.
- **Neutral** — side effects that are neither wins nor losses but worth noting
  (e.g. "future contributors need to learn X").

#### `alternatives` (required, ≥1)
Each alternative gets a one-line name and a one-line explanation of why we
rejected it. Naming an alternative without explaining the rejection is useless.
At least one alternative is mandatory — if there's no alternative, there's no
decision (see scope boundaries above).

#### `deciders` (optional)
Names or roles of who made the call. Useful for "ask Bob if you want to revisit".
Drop the field entirely if the user is solo and doesn't care.

#### `related` (optional)
Links to other ADRs, plans (`plans/...`), concept docs (`docs/concept/...`),
PRs, or external references. Drop if nothing to link.

### 2. Determine the sequence number

Scan `docs/adr/` for existing files matching the pattern `NNNN-*.md`. Take the
highest NNNN, add 1, zero-pad to 4 digits. If the directory is empty, start at
`0001`. The number is repo-scoped and never reused.

If `docs/adr/` doesn't exist yet, create it (and the optional README index —
see step 5).

### 3. Draft the ADR

Copy `templates/adr.template.md` verbatim and substitute the gathered
parameters. Drop empty optional sections rather than leaving placeholder text.
Read `examples/example.md` first if the template alone is ambiguous — a worked
example is worth a thousand schema descriptions.

### 4. Run the checklist

Open `checklist.md` and walk through every box against the draft. Every box
must pass. Common failures:
- Context drifts into naming the solution → move that prose to Decision.
- No alternative listed → not actually a decision; ask the user if maybe
  this belongs in `plan-generator` or `concept_generator` instead.
- Consequences has no negative entry → push the user to name the cost.
- References "the conversation" or "as discussed" → rewrite to stand alone.

### 5. Write the ADR

Write to `<repo-root>/docs/adr/NNNN-<slug>.md`.

If this is the first ADR (`docs/adr/` was just created), also write a small
`docs/adr/README.md` index stub so future ADRs have a place to register. The
index is optional to maintain — filenames are sortable and grep-able by slug.
A minimal stub:

```markdown
# Architecture Decision Records

Chronological log of significant project decisions. Each ADR is a short
markdown file explaining *why* a choice was made — not how to use it.

| ID | Title | Status | Date |
| --- | --- | --- | --- |
| 0001 | [Use PGlite instead of an external Postgres server](0001-use-pglite-instead-of-external-postgres.md) | Accepted | 2026-08-02 |
```

After writing, give the user the path and a one-line summary:

> ADR written: `docs/adr/0007-add-soft-delete-to-memory.md` (status: accepted)

### 6. Supersede protocol (only if this ADR replaces an earlier one)

When a new ADR overturns an earlier accepted decision:

1. In the **new** ADR's frontmatter, set `supersedes: [<old-id>, ...]`.
2. In the **old** ADR, change `status: accepted` → `status: superseded`.
3. In the **old** ADR's frontmatter, set `superseded_by: <new-id>`.
4. In the **old** ADR's `## Status` section, add a line:
   `Superseded by [ADR <new-id>](<new-id>-<slug>.md) on <YYYY-MM-DD>.`

The supersede chain must be bidirectional — a reader landing on either ADR must
be able to follow the link to the other. Do not delete or rewrite the old ADR;
its content stays as the historical record of what was decided *at the time*.

## What this skill deliberately does NOT do

- **Does not implement.** Recording the decision is the whole job. Implementation
  belongs in `plan-generator` or in direct edits.
- **Does not auto-suggest.** Pull-only. Even if you notice a significant decision
  being made mid-conversation, do not propose an ADR unless the user asks. This
  keeps noise low — the user decides what's worth recording.
- **Does not maintain a registry.** The `docs/adr/README.md` index is a
  convenience, not a source of truth. Filenames are the canonical handle.
- **Does not write `.bak` backups.** The repo is under git.
- **Does not commit.** The user commits when ready.

## Scope guardrails

If the user's request doesn't fit ADR shape, redirect:

- "Document how X works" → `concept_generator`.
- "Write a plan to do X" → `plan-generator`.
- "Just explain X to me" → answer inline, no skill.
- "Record a decision, then implement it" → do the ADR first (this skill), then
  drop out and hand off to `plan-generator` for the implementation.

## Files

- `templates/adr.template.md` — the canonical skeleton. Copy verbatim,
  substitute fields, drop unused sections.
- `checklist.md` — the readiness gates. Every box must pass before writing.
- `examples/example.md` — one fully-worked example (PGlite decision). Read it
  if the template alone is ambiguous.
