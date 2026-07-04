import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema";

/**
 * In-memory PGlite database with migrations applied, for use in tests.
 *
 * Uses an in-memory PGlite (no `dataDir`) so each test run is isolated and
 * automatically garbage-collected. Migrations are loaded from this package's
 * `drizzle/` folder (resolved relative to the compiled file so it works both
 * under tsx in workspace and from `dist/` in published builds).
 *
 * @example
 * ```ts
 * import { createTestDb, closeTestDb } from "@repo/database";
 *
 * let db: TestDb;
 * beforeAll(async () => { db = await createTestDb(); });
 * afterAll(async () => { await closeTestDb(db); });
 * ```
 */
export type TestDb = {
  pg: PGlite;
  db: ReturnType<typeof drizzle<typeof schema>>;
};

export async function createTestDb(): Promise<TestDb> {
  const pg = new PGlite();
  await pg.waitReady;

  const db = drizzle(pg, { schema });

  const __dirname = dirname(fileURLToPath(import.meta.url));
  // Works from both src/test-utils.ts (→ src/../drizzle) and dist/test-utils.js (→ dist/../drizzle)
  const migrationsFolder = join(__dirname, "../drizzle");

  await migrate(db, { migrationsFolder });

  return { pg, db };
}

export async function closeTestDb(testDb: TestDb): Promise<void> {
  await testDb.pg.close();
}
