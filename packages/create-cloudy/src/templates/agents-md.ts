export function buildAgentsMd(): string {
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

# Mermaid Diagram

When user asks to "gen diagram" or similar:

1. **Default:** Write mermaid code in response directly
2. **Do NOT** create workspace folder automatically
3. **Exception:** Only create file/folder if user explicitly asks
`
}
