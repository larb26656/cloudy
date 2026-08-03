import type { AppConfig } from "./config";
import { createProxyService } from "./features/proxy/proxy.service";
import { createInMemoryPtyRepository } from "./features/pty/in-memory-pty.repository";
import { createPtyService } from "./features/pty/pty.service";
import { createWorkspacesRepository } from "./features/workspaces/workspaces.repository";
import { createWorkspacesService } from "./features/workspaces/workspaces.service";
import { createDb, runMigrations, type DbClient } from "./db";

export function createContainer(config: AppConfig, overrideDb?: DbClient) {
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
