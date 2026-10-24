import type { AppConfig } from "./config";
import {
  createAgentsService,
  createAgentProviderSettingsService,
} from "./features/settings";
import { createLLMConnectionService } from "./features/llm-connections";
import { createChatGPTPlanService } from "./features/llm-connections/chatgpt-plan";
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
import { createCloudyMessagesRepository } from "./features/sessions/cloudy-messages.repository";
import { createDb, runMigrations, type DbClient } from "./db";
import {
  createEchoAdapter,
  createProviderEventHub,
  createAgentProviderRegistry,
  createProviderTemplateRegistry,
} from "./providers";
import { createCloudyAdapter } from "./providers/cloudy/cloudy.adapter";
import {
  createLLM,
  chatgptPlanProviderDefinition,
  openaiProviderDefinition,
} from "./lib/llm-provider";
import path from "node:path";

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
  const sessionsRepository = createSessionsRepository(db);
  const cloudyMessagesRepository = createCloudyMessagesRepository(db);
  const agentsService = createAgentsService(config, configDir);
  const templates = createProviderTemplateRegistry();
  const apiProviderRegistry = createLLM();
  apiProviderRegistry.registerProvider("openai", openaiProviderDefinition);
  apiProviderRegistry.registerProvider(
    "chatgpt-plan",
    chatgptPlanProviderDefinition,
  );
  const llmConnectionsService = createLLMConnectionService(
    config,
    configDir,
    apiProviderRegistry,
  );
  llmConnectionsService.registerConfiguredConnections();
  const chatgptPlanService = createChatGPTPlanService(
    configDir ?? path.dirname(config.dbPath),
    apiProviderRegistry,
  );
  void chatgptPlanService.registerConfiguredConnection();
  const agentProviderRegistry = createAgentProviderRegistry({
    providers: [
      createEchoAdapter(),
      createCloudyAdapter({
        apiProviderRegistry,
        sessionsRepository,
        messagesRepository: cloudyMessagesRepository,
        agents: () => agentsService.getAgents().agents,
      }),
      ...config.providers.instances
        .filter((instance) => instance.enabled)
        .map((instance) => templates.create(instance)),
    ],
  });
  const agentProviderSettingsService = createAgentProviderSettingsService(
    config,
    configDir,
    agentProviderRegistry,
  );
  const sessionsService = createSessionsService(
    sessionsRepository,
    agentProviderRegistry,
  );
  const providerEventHub = createProviderEventHub(agentProviderRegistry, {
    onEvent: (event) => sessionsService.applyEvent(event),
  });
  return {
    db,
    workspacesService,
    browserWorkspaceService,
    notificationsRepository,
    notificationsService,
    ptyService,
    agentsService,
    agentProviderSettingsService,
    llmConnectionsService,
    chatgptPlanService,
    agentProviderRegistry,
    sessionsService,
    providerEventHub,
  };
}

export type Container = ReturnType<typeof createContainer>;
