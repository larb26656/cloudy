import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

/**
 * Sync Drizzle client backed by `better-sqlite3`. All repository methods
 * operate on this type — no async, no Promises.
 */
export type DbClient = BetterSQLite3Database<typeof schema>;

/**
 * Open (or create) a SQLite database file and wrap it with Drizzle. Enables
 * WAL + foreign keys for sane defaults; callers handle migrations via
 * {@link runMigrations} before constructing a client for live use.
 *
 * @param dbPath Filesystem path to the SQLite file. `":memory:"` opens an
 *               in-memory database (used by tests).
 */
export function createDb(dbPath: string): { db: DbClient; close: () => void } {
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  return { db, close: () => sqlite.close() };
}
