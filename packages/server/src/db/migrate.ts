import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve the drizzle migrations folder across runtime layouts:
 * - tsx/source: `packages/server/src/db/` → `../../drizzle` lands at
 *   `packages/server/drizzle/`.
 * - Built library: `packages/server/dist/index.js` → `../drizzle` lands at
 *   `packages/server/drizzle/`.
 * - Bundled CLI: `apps/server/dist/cli.js` → `drizzle` lands at
 *   `apps/server/dist/drizzle/` (where `copy-assets` copies it).
 *
 * Returns the first existing candidate so the same module works whether
 * imported via tsx, the published library, or the bundled binary.
 */
function resolveMigrationsDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, "../../drizzle"),
    join(here, "../drizzle"),
    join(here, "drizzle"),
  ];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "meta", "_journal.json"))) return candidate;
  }
  const fallback = candidates[0];
  if (!fallback) throw new Error("Could not resolve migrations directory");
  return fallback;
}

/**
 * Run pending Drizzle SQL migrations against a SQLite database. Sync — opens
 * its own `better-sqlite3` connection, migrates, closes. Callers should then
 * open a fresh {@link createDb} connection for live queries.
 *
 * @param dbPath Filesystem path to the SQLite file. Parent dirs are created.
 * @param migrationsDir Optional override for the migrations folder. Defaults
 *                      to a runtime-layout-aware resolution (see
 *                      {@link resolveMigrationsDir}).
 */
export function runMigrations(dbPath: string, migrationsDir?: string): void {
  if (dbPath !== ":memory:") mkdirSync(dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);

  const migrationsFolder = migrationsDir ?? resolveMigrationsDir();

  migrate(db, { migrationsFolder });
  sqlite.close();
}
