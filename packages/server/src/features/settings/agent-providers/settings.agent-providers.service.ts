import { randomUUID } from "node:crypto";
import path from "node:path";
import type { AppConfig } from "../../../config";
import { updateFileConfig } from "../../../config/file-loader";
import type { AgentProviderSettings } from "../settings.model";
import type { AgentProviderRegistry } from "../../../providers/provider.registry";
import { createProviderTemplateRegistry } from "../../../providers/provider-template.registry";

export function createAgentProviderSettingsService(
  config: AppConfig,
  configDir?: string,
  registry?: AgentProviderRegistry,
) {
  const settingsDir = configDir ?? path.dirname(config.dbPath);
  const templates = createProviderTemplateRegistry();
  const instances = config.providers.instances;
  const persist = () =>
    updateFileConfig(settingsDir, (current) => ({
      ...current,
      providers: { instances },
    }));
  const reconcile = (instance: AgentProviderSettings) => {
    registry?.remove(instance.id);
    if (instance.enabled) registry?.register(templates.create(instance));
  };

  return {
    getAgentProviders() {
      return { instances };
    },
    getAgentProviderTemplates() {
      return { templates: templates.list() };
    },
    createAgentProvider(input: Omit<AgentProviderSettings, "id">) {
      const instance = { ...input, id: randomUUID() };
      instances.push(instance);
      try {
        persist();
      } catch (error) {
        instances.pop();
        throw error;
      }
      reconcile(instance);
      return instance;
    },
    updateAgentProvider(
      id: string,
      patch: Partial<Omit<AgentProviderSettings, "id">>,
    ) {
      const index = instances.findIndex((item) => item.id === id);
      if (index < 0) throw new Error(`Provider instance not found: ${id}`);
      const previous = instances[index]!;
      const updated = { ...previous, ...patch, id };
      instances[index] = updated;
      try {
        persist();
      } catch (error) {
        instances[index] = previous;
        throw error;
      }
      reconcile(updated);
      return updated;
    },
    deleteAgentProvider(id: string) {
      const index = instances.findIndex((item) => item.id === id);
      if (index < 0) throw new Error(`Provider instance not found: ${id}`);
      const [removed] = instances.splice(index, 1);
      try {
        persist();
      } catch (error) {
        instances.splice(index, 0, removed!);
        throw error;
      }
      registry?.remove(id);
      return { id };
    },
  };
}

export type AgentProviderSettingsService = ReturnType<
  typeof createAgentProviderSettingsService
>;
