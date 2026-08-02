---
id: <NNNN>-<slug>
title: <TITLE>
status: proposed | accepted | superseded | deprecated
date: <YYYY-MM-DD>
deciders: <names or roles — drop field if not relevant>
supersedes: []          # [id, ...] of ADRs this one replaces — drop if none
superseded_by: null     # id of ADR that replaces this one — drop if none
---

# ADR <NNNN>: <TITLE>

## Status

<status> — <one line, e.g. "Accepted on 2026-08-02". If superseded, add:
"Superseded by [ADR <new-id>](<new-id>-<slug>.md) on <date>." Delete this
italicized guidance before writing.>

## Context

<2-4 paragraphs. The PROBLEM, not the solution. What was broken, what we were
trying to decide, what constraints were in play. Anchor to specifics: file
paths, line numbers, real incidents, real numbers. A reader who wasn't here
should be able to reconstruct the situation and feel the tension that forced a
choice. Don't name the chosen solution here — that goes in Decision.>

## Decision

We <will/adopt/choose> <ONE-SENTENCE STATEMENT OF THE CHOICE>.

<1-2 short paragraphs giving the brief reason. The deep reasoning lives in
Alternatives (why not the others) and Context (the problem framing). Keep this
section tight — it's the answer, not the explanation.>

## Consequences

- **Positive:**
  - <what we gain>
  - <what we gain>
- **Negative:**
  - <what we give up or accept as a cost — AT LEAST ONE ENTRY REQUIRED>
  - <cost or trade-off>
- **Neutral:**
  - <side effect that's neither win nor loss but worth noting, e.g. "future
    contributors need to learn X">

## Alternatives Considered

- **<Alternative A name>** — <one line on why we rejected it. Concrete, not
  "didn't fit our needs" — name the actual reason.>
- **<Alternative B name>** — <one line on why we rejected it.>

<At least one alternative is required. If there is no alternative, there is no
decision — see the scope boundaries in SKILL.md.>

## Related

<Optional. Links to other ADRs, plans (`plans/...`), concept docs
(`docs/concept/...`), PRs, or external references. Drop the whole section if
nothing to link.>
