import type { AppConfig } from "./config";
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
  apiProviderRegistry.registerClient({
    id: "deepinfra",
    type: "openai",
    config: {
      apiKey: process.env.DEEP_INFRA_API_KEY ?? "not-configured",
      baseURL: "https://api.deepinfra.com/v1/openai",
    },
    models: [
      {
        modelId: process.env.CLOUDY_DEFAULT_MODEL ?? "google/gemma-3-12b-it",
        name: "Google Gemma 3 12B Instruct",
      },
    ],
  });
  const providerRegistry = createProviderRegistry({
    providers: [
      createEchoAdapter(),
      createCloudyAdapter({
        apiProviderRegistry,
        defaultApiProviderId: "deepinfra",
        defaultModel:
          process.env.CLOUDY_DEFAULT_MODEL ?? "google/gemma-3-12b-it",
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
    providerRegistry,
    sessionsService,
    providerEventHub,
  };
}

export type Container = ReturnType<typeof createContainer>;
