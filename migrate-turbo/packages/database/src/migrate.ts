import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Run pending Drizzle SQL migrations against a PGlite database.
 *
 * @param dbPath Filesystem path to the PGlite data directory.
 * @param migrationsDir Optional override for the migrations folder.
 *                      Defaults to `../drizzle` relative to this compiled file.
 */
export async function runMigrations(
  dbPath: string,
  migrationsDir?: string,
): Promise<void> {
  mkdirSync(dbPath, { recursive: true });

  const pg = new PGlite({ dataDir: dbPath });
  await pg.waitReady;

  const db = drizzle(pg);

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = migrationsDir ?? join(__dirname, "../drizzle");

  await migrate(db, { migrationsFolder });
  await pg.close();
}
