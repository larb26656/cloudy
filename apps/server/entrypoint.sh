#!/bin/sh
mkdir -p apps/server/data
echo "Running database migrations..."
bun run --filter @cloudy/server db:migrate || exit 1
echo "Starting server..."
exec bun run apps/server/src/index.ts
