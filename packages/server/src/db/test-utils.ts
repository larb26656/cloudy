import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema";
import type { DbClient } from "./client";

/**
 * In-memory SQLite database with migrations applied, for use in tests. Each
 * instance is isolated and dies when `closeTestDb` is called — no files
 * written to disk. Migrations are applied on the *same* connection that is
 * returned (a fresh `:memory:` db would otherwise be empty).
 *
 * @example
 * ```ts
 * let db: TestDb;
 * beforeAll(() => { db = createTestDb(); });
 * afterAll(() => { closeTestDb(db); });
 * ```
 */
export type TestDb = { db: DbClient; close: () => void };

export function createTestDb(): TestDb {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema }) as DbClient;

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = join(__dirname, "../../drizzle");

  migrate(db, { migrationsFolder });

  return { db, close: () => sqlite.close() };
}

export function closeTestDb(testDb: TestDb): void {
  testDb.close();
}
