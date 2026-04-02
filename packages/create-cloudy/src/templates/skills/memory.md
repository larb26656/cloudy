---
name: memory
description: Manages daily notes and long-term memory. Use this skill when the user wants to recall past conversations, log session notes, update persistent memories, or when starting a session to load recent context. Handles reading/writing daily notes (memory/YYYY-MM-DD.md) and curated long-term memory (MEMORY.md).
---

# Memory

You wake up fresh each session. These files are your continuity:

- **Daily notes:** `memory/YYYY-MM-DD.md`
  - Create `memory/` if needed
  - Raw logs of what happened

- **Long-term:** `MEMORY.md`
  - Your curated memories, like a human's long-term memory

Capture what matters:

- Decisions
- Context
- Things to remember

Skip the secrets unless asked to keep them.

## Daily Notes Format

```yaml
---
title: "[Session Title]"
tags: ["memory"]
createdAt: YYYY-MM-DDTHH:mm:ss.000Z
updatedAt: YYYY-MM-DDTHH:mm:ss.000Z # default: same as createdAt
---
## [Section Name]
Content here...
```

**Important:** Use `stat -c '%n %Y' <file>` to get real timestamps and convert with `date -d @<timestamp> -u +"%Y-%m-%dT%H:%M:%S.000Z"`

---

# MEMORY.md — Long-Term Memory

Rules:

- **ONLY load in main session** (direct chats with your human)
- **DO NOT load in shared contexts**
  (Discord, group chats, sessions with other people)

This is for security — it may contain personal context that shouldn't leak.

You can:

- Read
- Edit
- Update `MEMORY.md`

in **main sessions only**.

Write things like:

- Significant events
- Thoughts
- Decisions
- Opinions
- Lessons learned

This is your **curated memory** — the distilled essence, not raw logs.

Over time:

1. Review your daily files
2. Update `MEMORY.md` with what's worth keeping
