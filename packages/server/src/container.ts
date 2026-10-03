import type { AppConfig } from "./config";
import { createProxyService } from "./features/proxy/proxy.service";
import { createSettingsService } from "./features/settings";
import { createInMemoryPtyRepository } from "./features/pty/in-memory-pty.repository";
import { createPtyService } from "./features/pty/pty.service";
import { createNotificationsRepository } from "./features/notifications/notifications.repository";
import { createNotificationsService } from "./features/notifications/notifications.service";
import { createWorkspacesRepository } from "./features/workspaces/workspaces.repository";
import { createWorkspacesService } from "./features/workspaces/workspaces.service";
import { createBrowserWorkspaceService } from "./features/browser-workspace/browser-workspace.service";
import {
  createSessionsRepository,
  createSessionsService,
} from "./features/sessions";
import { createDb, runMigrations, type DbClient } from "./db";
import {
  createOpenCodeAdapter,
  createProviderEventHub,
  createProviderRegistry,
} from "./providers";

export function createContainer(
  config: AppConfig,
  overrideDb?: DbClient,
  configDir?: string,
) {
  const db =
    overrideDb ??
    (() => {
      runMigrations(config.dbPath);
      return createDb(config.dbPath).db;
    })();

  const workspacesRepository = createWorkspacesRepository(db);
  const workspacesService = createWorkspacesService(
    workspacesRepository,
    config.tempWorkspaceDir,
  );
  const browserWorkspaceService = createBrowserWorkspaceService(
    workspacesRepository,
    config.extensionWorkspaceDir,
  );

  const notificationsRepository = createNotificationsRepository(db);
  const notificationsService = createNotificationsService(
    notificationsRepository,
  );

  const ptyRepository = createInMemoryPtyRepository();
  const ptyService = createPtyService(ptyRepository);
  const proxyService = createProxyService(config.providers.opencode.baseUrl);
  const providerRegistry = createProviderRegistry({
    providers: config.providers.opencode.enabled
      ? [createOpenCodeAdapter({ baseUrl: config.providers.opencode.baseUrl })]
      : [],
  });
  const settingsService = createSettingsService(config, configDir);
  const sessionsRepository = createSessionsRepository(db);
  const sessionsService = createSessionsService(
    sessionsRepository,
    providerRegistry,
  );
  const providerEventHub = createProviderEventHub(providerRegistry, {
    onEvent: (event) => sessionsService.applyEvent(event),
  });
  return {
    db,
    workspacesService,
    browserWorkspaceService,
    notificationsRepository,
    notificationsService,
    ptyService,
    proxyService,
    settingsService,
    providerRegistry,
    sessionsService,
    providerEventHub,
  };
}

export type Container = ReturnType<typeof createContainer>;
