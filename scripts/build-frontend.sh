#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"

echo "Building frontend..."
cd "$ROOT_DIR" && bun run --filter @cloudy/web-app build

echo "Copying frontend to server public..."
cd "$ROOT_DIR" && cp -r apps/web-app/dist apps/server/public

echo "Frontend build complete!"
