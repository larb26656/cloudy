import type { AppConfig } from "./config";
import { createSettingsService } from "./features/settings";
import { createLLMProvidersService } from "./features/llm-providers";
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
  createEchoAdapter,
  createProviderEventHub,
  createProviderRegistry,
  createProviderTemplateRegistry,
} from "./providers";
import { createCloudyAdapter } from "./providers/cloudy/cloudy.adapter";
import { createLLM, openaiProviderDefinition } from "./lib/llm-provider";

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
  const templates = createProviderTemplateRegistry();
  const apiProviderRegistry = createLLM();
  apiProviderRegistry.registerProvider("openai", openaiProviderDefinition);
  const llmProvidersService = createLLMProvidersService(
    config,
    configDir,
    apiProviderRegistry,
  );
  llmProvidersService.registerConfiguredConnections();
  const providerRegistry = createProviderRegistry({
    providers: [
      createEchoAdapter(),
      createCloudyAdapter({
        apiProviderRegistry,
        getDefault: () => llmProvidersService.getDefault(),
      }),
      ...config.providers.instances
        .filter((instance) => instance.enabled)
        .map((instance) => templates.create(instance)),
    ],
  });
  const settingsService = createSettingsService(
    config,
    configDir,
    providerRegistry,
  );
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
    settingsService,
    llmProvidersService,
    providerRegistry,
    sessionsService,
    providerEventHub,
  };
}

export type Container = ReturnType<typeof createContainer>;
