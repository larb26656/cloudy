import { randomUUID } from "node:crypto";
import path from "node:path";
import type { AppConfig } from "../../config";
import { updateFileConfig } from "../../config/file-loader";
import { NotFoundError } from "../../shared/domain-error";
import type { LLM } from "../../lib/llm-provider";
import type {
  LLMConnectionDto,
  LLMConnectionInput,
} from "./llm-connections.model";

type StoredConnection = AppConfig["llm"]["connections"][number];

export function createLLMConnectionService(
  config: AppConfig,
  configDir: string | undefined,
  llm: LLM,
) {
  const settingsDir = configDir ?? path.dirname(config.dbPath);
  let connections = [...config.llm.connections];
  const persist = (nextConnections = connections) =>
    updateFileConfig(settingsDir, (current) => ({
      ...current,
      llm: {
        connections: nextConnections,
      },
    }));

  const normalizeConfig = (
    type: string,
    value: Record<string, unknown>,
    previous?: StoredConnection,
  ) => {
    const fields =
      llm.listProviderTypes().find((provider) => provider.id === type)
        ?.configFields ?? [];
    const merged = { ...previous?.config, ...value };
    for (const field of fields) {
      if (field.type === "secret" && !value[field.key]) {
        if (previous?.config[field.key])
          merged[field.key] = previous.config[field.key];
        else delete merged[field.key];
      } else if (
        field.type !== "secret" &&
        value[field.key] === "" &&
        !field.required
      ) {
        delete merged[field.key];
      }
    }
    return llm.parseProviderConfig(type, merged) as Record<string, unknown>;
  };

  const safeConnection = (connection: StoredConnection): LLMConnectionDto => {
    const secretKeys = new Set(
      llm
        .listProviderTypes()
        .find((provider) => provider.id === connection.type)
        ?.configFields.filter((field) => field.type === "secret")
        .map((field) => field.key) ?? [],
    );
    const config = Object.fromEntries(
      Object.entries(connection.config).filter(([key]) => !secretKeys.has(key)),
    );
    const secretsConfigured = Object.fromEntries(
      [...secretKeys].map((key) => [key, Boolean(connection.config[key])]),
    );
    return {
      id: connection.id,
      name: connection.name,
      type: connection.type,
      config,
      secretsConfigured,
      modelIds: connection.modelIds,
    };
  };

  const register = (connection: StoredConnection, replace = false) =>
    llm.registerClient(
      {
        id: connection.id,
        type: connection.type,
        config: connection.config,
        models: connection.modelIds.map((modelId) => ({
          modelId,
          name: modelId,
          providerName: connection.name,
        })),
      },
      replace,
    );

  return {
    getSettings() {
      return {
        providerTypes: llm
          .listProviderTypes()
          .filter((provider) => provider.id !== "chatgpt-plan"),
        connections: connections.map(safeConnection),
      };
    },
    createConnection(input: LLMConnectionInput) {
      const connection: StoredConnection = {
        id: randomUUID(),
        name: input.name,
        type: input.type,
        config: normalizeConfig(input.type, input.config),
        modelIds: input.modelIds,
      };
      const next = [...connections, connection];
      persist(next);
      connections = next;
      register(connection);
      return safeConnection(connection);
    },
    updateConnection(
      id: string,
      patch: Partial<Omit<LLMConnectionInput, "type">>,
    ) {
      const index = connections.findIndex((item) => item.id === id);
      if (index < 0) throw new NotFoundError(`LLM connection not found: ${id}`);
      const previous = connections[index]!;
      const updated: StoredConnection = {
        ...previous,
        ...(patch.name ? { name: patch.name } : {}),
        ...(patch.config
          ? { config: normalizeConfig(previous.type, patch.config, previous) }
          : {}),
        ...(patch.modelIds ? { modelIds: patch.modelIds } : {}),
      };
      const next = connections.map((item) => (item.id === id ? updated : item));
      persist(next);
      connections = next;
      register(updated, true);
      return safeConnection(updated);
    },
    deleteConnection(id: string) {
      const next = connections.filter((item) => item.id !== id);
      if (next.length === connections.length)
        throw new NotFoundError(`LLM connection not found: ${id}`);
      persist(next);
      connections = next;
      llm.deleteClient(id);
      return { id };
    },
    registerConfiguredConnections() {
      for (const connection of connections) register(connection);
    },
  };
}

export type LLMConnectionService = ReturnType<
  typeof createLLMConnectionService
>;
