# Cloudy Monorepo

## Projects

| Package | Description |
|---------|-------------|
| `@cloudy/server` | Elysia-based API server (TypeScript) |
| `@cloudy/web-app` | React 19 web application (TypeScript, Vite, Tailwind) |
| `@cloudy/contracts` | Shared TypeScript contracts |

## Common Commands

```bash
bun install          # Install dependencies
bun run dev          # Run all apps in dev mode
bun run lint         # Lint all code (Biome)
bun run lint:write   # Format + fix
```

## TypeScript Config

All packages use strict TypeScript (`tsconfig.base.json`):
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitOverride: true`
- `moduleResolution: bundler`
- `target: ESNext`

## Shared Conventions

- Files: `kebab-case`, `PascalCase.tsx` for React components
- Variables/functions: `camelCase`
- Types/interfaces: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE` for config, `camelCase` for runtime
- One major type/class per file
- Index files for public exports
- Async/await consistently

## Project-Specific Docs

- [Server AGENTS.md](./apps/server/AGENTS.md)
- [Web-app AGENTS.md](./apps/web-app/AGENTS.md)
