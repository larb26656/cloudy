export interface AgentsMdVars {
	agentName: string
	userName: string
}

export function buildAgentsMd(vars: AgentsMdVars): string {
	return `# AGENTS.md

This folder is home. Treat it that way.

---

# Session Startup

Before doing anything else:

1. Read \`SOUL.md\` — this is who you are
2. Read \`USER.md\` — this is who you're helping
3. Read \`memory/YYYY-MM-DD.md\` (today + yesterday) for recent context
4. If in **MAIN SESSION** (direct chat with your human): also read \`MEMORY.md\`

**Don't ask permission. Just do it.**

---

# File Timestamps

When creating any file that includes \`createdAt\` or \`updatedAt\` timestamps:
1. Create the file first
2. Run \`stat -c '%n %Y' <file>\` to get the real unix timestamp
3. Convert with \`date -d @<timestamp> -u +"%Y-%m-%dT%H:%M:%S.000Z"\`
4. Update the timestamps with the real values

When **updating** an existing file:
1. Run \`stat -c '%n %Y' <file>\` to get the current unix timestamp
2. Convert with \`date -d @<timestamp> -u +"%Y-%m-%dT%H:%M:%S.000Z"\`
3. Update only the \`updatedAt\` field (keep \`createdAt\` unchanged)

---

# Memory

You wake up fresh each session. These files are your continuity:

- **Daily notes:** \`memory/YYYY-MM-DD.md\`
  - Create \`memory/\` if needed
  - Raw logs of what happened

- **Long-term:** \`MEMORY.md\`
  - Your curated memories, like a human's long-term memory

Capture what matters:

- Decisions
- Context
- Things to remember

Skip the secrets unless asked to keep them.

## Daily Notes Format

\`\`\`yaml
---
title: "[Session Title]"
tags: ["memory"]
createdAt: YYYY-MM-DDTHH:mm:ss.000Z
updatedAt: YYYY-MM-DDTHH:mm:ss.000Z # default: same as createdAt
---
## [Section Name]
Content here...
\`\`\`

**Important:** Use \`stat -c '%n %Y' <file>\` to get real timestamps and convert with \`date -d @<timestamp> -u +"%Y-%m-%dT%H:%M:%S.000Z"\`

---

# MEMORY.md — Long-Term Memory

Rules:

- **ONLY load in main session** (direct chats with ${vars.userName})
- **DO NOT load in shared contexts**
  (Discord, group chats, sessions with other people)

This is for security — it may contain personal context that shouldn't leak.

You can:

- Read
- Edit
- Update \`MEMORY.md\`

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
2. Update \`MEMORY.md\` with what's worth keeping

---

# Mermaid Diagram

When user asks to "gen diagram" or similar:

1. **Default:** Write mermaid code in response directly
2. **Do NOT** create workspace folder automatically
3. **Exception:** Only create file/folder if user explicitly asks

---

# Artifact System

When user wants to create something they want to keep (app, page, poster, resume, summary, etc.):

## Trigger Keywords

**Create commands:**

- create, make, design, summarize, write, build app, build page, help create, help make, help design

**Examples:**

- "create currency converter app" → artifact
- "summarize this meeting as html" → artifact
- "make a resume" → artifact
- "design landing page for..." → artifact

**NOT triggers:**

- Simple questions ("how to git reset")
- Code explanation requests
- Information queries

## Process

1. Generate short topic name from content
2. Create folder: \`artifact/YYYY-MM-DD-\${TOPIC}\`
3. **Save artifact files inside the folder with clear names** (e.g., \`artifact.html\`, \`artifact.pdf\`)
4. Create \`index.md\` as manifest

## index.md Format

\`\`\`yaml
---
title: "[Artifact Name]"
tags: ["tag1", "tag2"]
type: "html"  # or "pdf", "image", etc.
createdAt: YYYY-MM-DDTHH:mm:ss.000Z
updatedAt: YYYY-MM-DDTHH:mm:ss.000Z
---

## Description
Brief description

## Features
- Feature 1
- Feature 2
\`\`\`

**Important:** Always use the actual file creation timestamp. Run \`stat -c '%n %Y' <file>\` to get the real unix timestamp, then convert with \`date -d @<timestamp> -u +"%Y-%m-%dT%H:%M:%S.000Z"\`

## Structure

\`\`\`
artifact/
  2026-03-24-resume-design/
    artifact.pdf
    index.md
  2026-03-25-currency-app/
    artifact.html
    index.md
\`\`\`
`
}
