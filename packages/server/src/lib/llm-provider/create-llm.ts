import type { ModelInfo } from "@repo/ai-core";
import type { LLMProviderDefinition, LLMClient } from "./types";
import { LLMProviderConflictError, LLMProviderNotFoundError } from "./errors";

interface RegisterClientOptions {
  id: string;
  type: string;
  config: unknown;
  models: Omit<ModelInfo, "providerId">[];
}

export function createLLM() {
  const providers = new Map<string, LLMProviderDefinition>();
  const clients = new Map<string, LLMClient>();

  return {
    registerProvider<TConfig>(
      type: string,
      definition: LLMProviderDefinition<TConfig>,
    ) {
      if (providers.has(type)) {
        throw new LLMProviderConflictError(`Provider "${type}" already exists`);
      }

      providers.set(type, definition as LLMProviderDefinition);
    },

    registerClient(options: RegisterClientOptions, replace = false) {
      const definition = providers.get(options.type);

      if (!definition) {
        throw new LLMProviderNotFoundError(`Unknown provider: ${options.type}`);
      }

      const config = definition.configSchema.parse(options.config);
      const adapter = definition.create(config);

      const client: LLMClient = {
        id: options.id,
        providerType: options.type,
        models: options.models.map((model) => ({
          ...model,
          providerId: options.id,
        })),
        ...adapter,
      };

      if (clients.has(client.id) && !replace) {
        throw new LLMProviderConflictError(
          `Client "${client.id}" already exists`,
        );
      }

      clients.set(client.id, client);

      return client;
    },

    getClient: (id: string) => clients.get(id),

    listClients: () => [...clients.values()],

    listProviders: () => [...providers.keys()],

    listProviderTypes: () =>
      [...providers.entries()].map(([id, definition]) => ({
        id,
        name: definition.settings.name,
        configFields: definition.settings.configFields,
      })),

    parseProviderConfig(type: string, config: unknown) {
      const definition = providers.get(type);
      if (!definition)
        throw new LLMProviderNotFoundError(`Unknown provider: ${type}`);
      return definition.configSchema.parse(config);
    },

    listModels: () => [...clients.values()].flatMap((client) => client.models),

    deleteClient: (id: string) => clients.delete(id),
  };
}

export type LLM = ReturnType<typeof createLLM>;
