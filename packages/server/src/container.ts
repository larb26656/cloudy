import type { CloudyConfig } from "./config";
import { createProxyService } from "./features/proxy/proxy.service";
import { createInMemoryPtyRepository } from "./features/pty/in-memory-pty.repository";
import { createPtyService } from "./features/pty/pty.service";
import { createWorkspacesRepository } from "./features/workspaces/workspaces.repository";
import { createWorkspacesService } from "./features/workspaces/workspaces.service";
import { createDb, runMigrations, type DbClient } from "./db";

/**
 * Build all wired services for the application. Manual DI: db → repositories →
 * services → controllers. Sync throughout — `better-sqlite3` is sync. The
 * returned object is consumed by `createApp` / `createServer`.
 *
 * @param config Resolved cloudy config (provides `dbPath`).
 * @param overrideDb Optional pre-opened client (used by tests to inject an
 *                   in-memory db). When omitted, migrations run against
 *                   `config.dbPath` and a fresh client is opened on it.
 */
export function createContainer(config: CloudyConfig, overrideDb?: DbClient) {
  const db =
    overrideDb ??
    (() => {
      runMigrations(config.dbPath);
      return createDb(config.dbPath).db;
    })();

  const workspacesRepository = createWorkspacesRepository(db);
  const workspacesService = createWorkspacesService(workspacesRepository);

  const ptyRepository = createInMemoryPtyRepository();
  const ptyService = createPtyService(ptyRepository);
  const proxyService = createProxyService(config.opencodeApiBase);
  return { db, workspacesService, ptyService, proxyService };
}

export type Container = ReturnType<typeof createContainer>;
