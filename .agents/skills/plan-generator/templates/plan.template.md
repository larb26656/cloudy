---
title: <TITLE>
slug: <SLUG>
id: <YYYYMMDD>-<SLUG>
status: ready
created: <YYYY-MM-DD>
source: <session id or "planning session YYYY-MM-DD">
---

# Plan: <TITLE>

## Why

<2-3 sentences. What's broken / missing / wanted. The outcome the user wants. Must stand
alone — no "as we discussed".>

## Target file

| Path | Action |
| --- | --- |
| `<repo-relative path>` | edit \| create \| delete |

## Context the new session needs

<Anything non-obvious a fresh session would have to rediscover. Anchor to file:line where
possible. Cover: existing code worth reading, conventions to respect (pull from the repo's
AGENTS.md), decisions already made and why, gotchas. This is the most important section —
empty context = useless plan.>

## Tasks

- [ ] 1. **<one-sentence action>**
  - verify: `<runnable command or one-line assertion>`
  - files: `<path>`
- [ ] 2. **<one-sentence action>**
  - verify: `<runnable command or one-line assertion>`
  - files: `<path>`

Order tasks so the repo is in a working state after each one where possible.

## Done when

- [ ] <observable outcome — command exit code, HTTP response, file contents>
- [ ] <observable outcome>
- [ ] <observable outcome>

## Notes for implementer

<Optional. Actionable warnings only: conventions, lint/test commands, do/don't. Drop the
whole section if there's nothing to say. Pull from AGENTS.md rather than inventing.>
