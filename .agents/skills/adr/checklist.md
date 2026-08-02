# ADR readiness checklist

Walk through every box before writing the ADR file. If any fails, fix the ADR
first. The point of this list is that a bad ADR is silent corruption — future
readers don't error out, they just get a misleading record and make worse
decisions because of it. These gates catch the common failure modes.

## Frontmatter

- [ ] `id` = `NNNN-<slug>` where NNNN is highest-existing + 1 (zero-padded to 4)
- [ ] `slug` = kebab-case of `title` (lowercase, hyphen-separated, no spaces)
- [ ] `title` ≤60 chars and states the CHOICE, not just the topic
      (good: "Use PGlite instead of Postgres"; bad: "Database decision")
- [ ] `status` is one of `proposed | accepted | superseded | deprecated`
- [ ] `date` filled in (YYYY-MM-DD)
- [ ] Optional fields (`deciders`, `supersedes`, `superseded_by`) present only
      when they have real content; drop placeholders

## Context

- [ ] Talks about the PROBLEM, not the chosen solution
- [ ] Anchored to specifics (file paths, line numbers, real incidents, numbers)
      — not just abstract prose
- [ ] Self-contained — no "as we discussed", "in the meeting", "the conversation"
- [ ] A reader who wasn't present can reconstruct why this was even a question

## Decision

- [ ] First sentence starts with "We will...", "We adopt...", or "We choose..."
- [ ] States the choice clearly in one sentence up top
- [ ] Reasoning is brief — the deep why lives in Alternatives and Context, not
      here. If Decision is longer than Context, that's a smell.

## Consequences

- [ ] All three buckets present: Positive, Negative, Neutral
- [ ] Negative has AT LEAST ONE entry. A decision with no downsides is
      suspicious — push the user to name the cost honestly
- [ ] Each entry is concrete, not "we have flexibility" or "it's better"

## Alternatives

- [ ] At least one alternative listed. If there's no alternative, there's no
      decision — see SKILL.md scope boundaries
- [ ] Each alternative has a concrete rejection reason — not "didn't fit",
      "not suitable", or "we preferred X". Name the actual reason
- [ ] If only one alternative was seriously considered, that's fine — but
      explain why others weren't on the table

## Scope check (most important gate)

- [ ] This records WHY we picked X over Y — not HOW to use X
- [ ] If the user wants to implement the decision, that goes in `plan-generator`,
      not here
- [ ] If the user wants to explain how X works, that goes in `concept_generator`,
      not here
- [ ] The decision is load-bearing — reversing it later would cost something.
      Trivial choices don't need ADRs

## Supersede protocol (only if this ADR replaces an earlier one)

- [ ] New ADR frontmatter has `supersedes: [<old-id>]`
- [ ] Old ADR `status` changed from `accepted` → `superseded`
- [ ] Old ADR frontmatter has `superseded_by: <new-id>`
- [ ] Old ADR `## Status` section links to the new ADR with date
- [ ] Bidirectional links work — a reader landing on either ADR can find the
      other
- [ ] Old ADR content left intact as historical record — not rewritten to match
      the new decision

## File

- [ ] Path is `<repo-root>/docs/adr/<NNNN>-<slug>.md`
- [ ] No `.bak` file written — git covers rollback
- [ ] If `docs/adr/` was just created and this is the first ADR, a minimal
      `docs/adr/README.md` index stub exists (optional but recommended)
