# Cloudy

<p align="center">
  <img src="assets/logo.png" alt="Cloudy" width="200"/>
</p>

> Your AI Agent's Sidekick

Cloudy is the intuitive interface that makes OpenCode AI accessible to everyone. **Chat**, capture **ideas**, build **memories**, and manage **artifacts** — no CLI required.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Bun](https://img.shields.io/badge/Bun-1.3.5+-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue)

## Why Cloudy?

Most AI coding agents are powerful but require terminal expertise. Cloudy bridges that gap — bringing the full power of OpenCode AI to a friendly, unified interface.

- **Chat Naturally** — Talk to your AI agent like talking to a teammate
- **Capture Ideas** — Track features, tasks, and brainstorms with status and priority
- **Build Memory** — Store knowledge, docs, and learnings your AI can recall
- **Manage Artifacts** — Keep generated files, snippets, and outputs organized

## Features

### 💬 Chat

Real-time streaming conversations with beautiful markdown rendering, syntax highlighting, and session management.

### 💡 Idea

Track your ideas, tasks, and features:

- **Status** — pending, in-progress, done
- **Priority** — low, medium, high
- **Tags** — organize and filter
- **Markdown** — rich descriptions

### 🧠 Memory

Build your AI's knowledge base:

- Store context, documentation, and learnings
- Search and filter by tags
- AI can reference it in conversations

### 📦 Artifact

Manage generated content:

- **Types** — documents, code, images, and more
- **Preview** — view artifacts inline
- **Tags** — organize by project or category

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.5
- OpenCode API server running on `http://127.0.0.1:4096`

### Run

```bash
# Install dependencies
bun install

# Start development
bun run dev
```

Open `http://localhost:3001` and start using your AI workspace.

- **Backend API:** `http://localhost:3000`
- **Frontend:** `http://localhost:3001`

## Tech Stack

| Layer         | Technology                         |
| ------------- | ---------------------------------- |
| Frontend      | React 19, TypeScript, Tailwind CSS |
| State         | Zustand                            |
| UI Components | shadcn/ui                          |
| Backend       | Bun, Elysia.js                     |
| Types         | Shared contracts package           |

## Project Structure

```
cloudy/
├── apps/
│   ├── server/           # API server
│   └── web-app/         # React interface
│       └── src/features/
│           ├── chat/     # Chat interface
│           ├── idea/     # Idea management
│           ├── memory/   # Knowledge base
│           └── artifact/ # Artifact management
└── packages/
    └── contracts/       # Shared TypeScript types
```

## Documentation

- [Product Requirements](apps/web-app/docs/PRD.md) — What Cloudy does and why
- [Architecture](apps/web-app/docs/ARCHITECTURE.md) — How it's built

## Contributing

Contributions welcome! Feel free to open issues and PRs.

## License

MIT
