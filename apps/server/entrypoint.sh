#!/bin/sh
mkdir -p apps/server/data
echo "Running database migrations..."
bun run db:migrate || exit 1
echo "Starting server..."
exec bun run apps/server/src/index.ts
