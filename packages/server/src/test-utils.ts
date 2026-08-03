import { createApp, type AppType } from "./server";
import { createContainer, type Container } from "./container";
import { createTestDb, closeTestDb, type TestDb } from "./db";
import type { AppConfig } from "./config";

export { createTestDb, closeTestDb, type TestDb };
export type { AppConfig, Container, AppType };

/**
 * Shared base config for integration tests. Override per-test via
 * `createTestApp({ ... })`.
 */
export const testConfig: AppConfig = {
  dbPath: "/tmp/cloudy-test.db",
  ui: false,
  host: "localhost",
  port: 4122,
  cors: [],
  opencodeApiBase: "http://opencode.test",
};

/**
 * Build a fresh Hono app backed by an isolated in-memory SQLite database.
 * Caller owns the lifecycle — invoke `close()` in `afterEach`/`afterAll`.
 *
 * @example
 * ```ts
 * let env: ReturnType<typeof createTestApp>;
 * beforeEach(() => { env = createTestApp(); });
 * afterEach(() => { env.close(); });
 * // then use env.app.request(...) inside tests
 * ```
 */
export function createTestApp(configOverrides: Partial<AppConfig> = {}): {
  app: AppType;
  db: TestDb;
  container: Container;
  close: () => void;
} {
  const db = createTestDb();
  const container = createContainer({ ...testConfig, ...configOverrides }, db.db);
  const app = createApp({ container });
  return { app, db, container, close: () => closeTestDb(db) };
}
