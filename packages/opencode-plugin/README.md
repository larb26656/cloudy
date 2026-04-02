# @cloudy-app/opencode-plugin

OpenCode plugin for Cloudy — idea management tools with automatic session tracking and file protection.

## Features

- **Idea CRUD tools** — `idea_list`, `idea_create`, `idea_update`, `idea_remove` exposed as OpenCode tools
- **File protection** — prevents destructive commands on the idea directory
- **Auto touch** — automatically syncs idea metadata when idea files are written/edited

## Installation

```bash
# bun (recommended)
bun add @cloudy-app/opencode-plugin

# npm
npm install @cloudy-app/opencode-plugin
```

## Usage

Add the plugin to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@cloudy-app/opencode-plugin"]
}
```

### Environment Variables

| Variable                     | Default                 | Description                     |
| ---------------------------- | ----------------------- | ------------------------------- |
| `CLOUDY_ASSISTANT_BASE_PATH` | `./base-path`           | Base directory for idea storage |
| `CLOUDY_API_BASE_PATH`       | `http://localhost:3000` | Cloudy API server URL           |

### Tools

| Tool          | Description                                                       |
| ------------- | ----------------------------------------------------------------- |
| `idea_list`   | List ideas with optional filters (status, priority, tags, search) |
| `idea_create` | Create a new idea with title and metadata                         |
| `idea_update` | Update idea metadata (title, tags, status, priority)              |
| `idea_remove` | Delete an idea by path                                            |

### Guards

The plugin automatically blocks:

- Destructive bash commands targeting the idea directory (`rm`, `mv`, `cp`, etc.)
- Overwriting `index.md` inside idea directories

## Development

```bash
bun install

# Build
bun run build

# Test
bun test

# Lint
bun run lint:write
```

## Testing Locally Before Publish

### Option 1: `bun link` (recommended)

```bash
# Setup — build + create global link
bun run build
bun link

# Use in another project
bun link @cloudy-app/opencode-plugin

# Cleanup when done
bun unlink @cloudy-app/opencode-plugin
```

### Option 2: Direct tarball

```bash
bun run build
npm pack --dry-run
```

## Publishing

### Prerequisites

- npm account with publish permission to `@cloudy` org
- Logged in via `npm login`
- All changes committed and pushed

### Steps

```bash
# 1. Build and test
bun run build
bun test

# 2. Verify the tarball contents
npm pack --dry-run

# 3. Bump version
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0

# 4. Publish
npm publish
```

### CI/CD (Optional)

```yaml
- run: bun install
- run: bun run build
- run: bun test
- run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
