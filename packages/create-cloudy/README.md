# @cloudy-app/create-cloudy

CLI tool to scaffold Cloudy — AI agent sidekick config with interactive prompts.

## Usage

```bash
# bun (recommended)
bunx @cloudy-app/create-cloudy

# npm
npx @cloudy-app/create-cloudy

# pnpm
pnpm dlx @cloudy-app/create-cloudy

# yarn
yarn dlx @cloudy-app/create-cloudy
```

### Flags

| Flag | Description |
|------|-------------|
| `--yes` | Skip prompts, use defaults |
| `--dir <path>` | Specify target directory |

## Development

```bash
bun install

# Run in dev mode (uses Bun directly, no build needed)
bun run dev

# Build for production
bun run build

# Test CLI output
bun run test:cli

# Lint
bun run lint:write
```

## Testing Locally Before Publish

### Option 1: `bun link` (recommended)

```bash
# Setup — build + create global link
bun run test:local

# Run from anywhere
bunx @cloudy-app/create-cloudy --yes --dir=test-output

# Cleanup when done
bun run test:unlink
```

### Option 2: Direct execution

```bash
bun run build
bun ./dist/index.js --yes --dir=.test-output
```

### Option 3: Test via tarball (npx only)

`bunx` does not support local tarball paths. Use `npx` instead:

```bash
# Build + pack into tarball
bun run test:pack

# Test with npx
npx ./cloudy-app-create-cloudy-0.1.0.tgz --yes --dir=test-output
```

## Publishing

### Prerequisites

- npm account with publish permission to `@cloudy-app` org
- Logged in via `npm login`
- All changes committed and pushed

### Steps

```bash
# 1. Lint and build
bun run lint
bun run build

# 2. Verify the tarball contents
npm pack --dry-run

# 3. Bump version
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm version major   # 0.1.0 → 1.0.0

# 4. Publish (publishConfig.access is set to public)
npm publish
```

### CI/CD (Optional)

Add to GitHub Actions for automated publishing on tag:

```yaml
- run: bun install
- run: bun run build
- run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
