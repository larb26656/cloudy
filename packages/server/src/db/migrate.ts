import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const bundledMigrationsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "drizzle",
);

/**
 * Run pending Drizzle SQL migrations against a SQLite database. Sync — opens
 * its own `better-sqlite3` connection, migrates, closes. Callers should then
 * open a fresh {@link createDb} connection for live queries.
 *
 * @param dbPath Filesystem path to the SQLite file. Parent dirs are created.
 */
export function runMigrations(dbPath: string): void {
  if (dbPath !== ":memory:") mkdirSync(dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);

  migrate(db, { migrationsFolder: bundledMigrationsDir });
  sqlite.close();
}
