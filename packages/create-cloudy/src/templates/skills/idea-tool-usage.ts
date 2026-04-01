export function buildIdeaToolUsageSkill(): string {
	return `---
name: idea-tool-usage
description: Guide for choosing the right tool when working with ideas. Use this skill when creating, editing, deleting, listing, or updating ideas — to know whether to use the custom idea tools (idea-list, idea-create, idea-update, idea-delete) or standard tools (edit, write, read, bash). Also enforces that bash must NEVER be used to modify files — always prefer edit/write tools instead.
---

## Idea Tools vs Standard Tools

This project has a dedicated idea management system. Each idea lives as a folder with an \`index.md\` file generated from metadata. Understanding which tool to use prevents data corruption and keeps metadata in sync.

## Custom Idea Tools

These are registered as custom tools via the OpenCode plugin. They communicate with the Cloudy API server.

| Tool | When to use | What it does |
|------|-------------|--------------|
| \`idea-list\` | "show me ideas", "find ideas about X", "what ideas are in-progress?" | Lists ideas with optional filters (query, status, priority, tags) |
| \`idea-create\` | "create a new idea", "I have an idea for...", "add idea" | Creates idea via API, generates folder + \`index.md\` automatically |
| \`idea-update\` | "mark idea as done", "change priority", "rename idea", "add tags" | Updates metadata (title, status, priority, tags) by idea path |
| \`idea-delete\` | "delete idea", "remove this idea" | Permanently deletes idea folder and all files |

## Standard Tools

Use these for idea **content** (not metadata):

| Tool | When to use | What it does |
|------|-------------|--------------|
| \`read\` | Read idea content files (\`notes.md\`, code snippets, etc.) | Safe — read-only |
| \`edit\` | Edit idea content files (NOT \`index.md\`) | Modifies content, auto-touches idea timestamp |
| \`write\` | Create new files inside an idea folder (NOT \`index.md\`) | Creates files, auto-touches idea timestamp |

## Decision Flowchart

\`\`\`
What do you want to do with an idea?
│
├─ List / search ideas → idea-list
│
├─ Create a new idea → idea-create
│   (don't mkdir or write files manually)
│
├─ Change metadata (title/status/priority/tags) → idea-update
│   (don't edit index.md directly — it's auto-generated)
│
├─ Delete an idea → idea-delete
│   (don't rm -rf the folder)
│
├─ Read idea content → read tool
│
├─ Edit idea content files (notes, code, etc.) → edit tool
│
├─ Create a new file inside an idea → write tool
│
└─ Anything else with bash → see below
\`\`\`

## Protected: \`index.md\`

Every idea folder has an \`index.md\` file generated from metadata. This file is **protected**:

- **NEVER** edit \`index.md\` with the \`edit\` tool — it will be rejected
- **NEVER** overwrite \`index.md\` with the \`write\` tool — it will be rejected
- **NEVER** delete or move idea files via \`bash\` — destructive commands on the idea directory are blocked
- To change what appears in \`index.md\`, use \`idea-update\` to change the idea's metadata

## Bash Restrictions for Ideas

The plugin hard-blocks these bash commands when they target the idea directory:

- \`rm\`, \`mv\`, \`cp\`, \`rmdir\`, \`chmod\`, \`chown\`, \`ln\`

Reading commands like \`ls\`, \`cat\`, \`grep\`, \`find\` on the idea directory are allowed.

## Bash Restrictions for ALL Files

Even outside ideas, bash should NOT be used to modify files. These patterns are wrong:

| Instead of this | Use this |
|-----------------|----------|
| \`sed -i 's/old/new/' file\` | \`edit\` tool |
| \`echo "content" > file\` | \`write\` tool |
| \`cat <<EOF > file\` | \`write\` tool |
| \`printf "content" >> file\` | \`edit\` tool |
| \`tee file\` | \`write\` tool |

Bash is for: \`git\`, \`npm\`, \`bun\`, \`docker\`, \`make\`, \`tsc\`, \`biome\`, \`pytest\`, \`bun test\`, \`ls\`, \`grep\`, \`find\`, \`gh\`, etc.
`
}
