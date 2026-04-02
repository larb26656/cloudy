---
name: artifact
description: Manages artifact creation and organization. Use this skill when the user wants to create something they want to keep — apps, pages, posters, resumes, summaries, etc. Handles creating artifact folders with proper manifest (index.md) and file structure.
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
2. Create folder: `artifact/YYYY-MM-DD-${TOPIC}`
3. **Save artifact files inside the folder with clear names** (e.g., `artifact.html`, `artifact.pdf`)
4. Create `index.md` as manifest

## index.md Format

```yaml
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
```

**Important:** Always use the actual file creation timestamp. Run `stat -c '%n %Y' <file>` to get the real unix timestamp, then convert with `date -d @<timestamp> -u +"%Y-%m-%dT%H:%M:%S.000Z"`

## Structure

```
artifact/
  2026-03-24-resume-design/
    artifact.pdf
    index.md
  2026-03-25-currency-app/
    artifact.html
    index.md
```
