#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"

echo "==> Building frontend..."
cd "$ROOT_DIR" && bun run --filter @cloudy/web-app build

echo "==> Cleaning dist folder..."
cd "$ROOT_DIR" && rm -rf apps/server/dist

echo "==> Bundling server CLI..."
cd "$ROOT_DIR" && bun run --filter @cloudy/server build

echo "==> Copying public assets to dist..."
cd "$ROOT_DIR" && cp -r apps/server/public apps/server/dist/

echo "==> Build complete!"
echo ""
echo "Output: apps/server/dist/"
ls -la apps/server/dist/
