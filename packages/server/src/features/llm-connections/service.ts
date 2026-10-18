import { randomUUID } from "node:crypto";
import path from "node:path";
import type { AppConfig } from "../../config";
import { updateFileConfig } from "../../config/file-loader";
import type { LLM } from "../../lib/llm-provider";
import type { LLMConnectionDto, LLMConnectionInput } from "./model";

type StoredConnection = AppConfig["llm"]["connections"][number];

export function createLLMConnectionService(
  config: AppConfig,
  configDir: string | undefined,
  llm: LLM,
) {
  const settingsDir = configDir ?? path.dirname(config.dbPath);
  let connections = [...config.llm.connections];
  let defaultValue =
    config.llm.defaultConnectionId && config.llm.defaultModelId
      ? {
          connectionId: config.llm.defaultConnectionId,
          modelId: config.llm.defaultModelId,
        }
      : null;

  const persist = (nextConnections = connections, nextDefault = defaultValue) =>
    updateFileConfig(settingsDir, (current) => ({
      ...current,
      llm: {
        connections: nextConnections,
        defaultConnectionId: nextDefault?.connectionId ?? null,
        defaultModelId: nextDefault?.modelId ?? null,
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
        })),
      },
      replace,
    );

  return {
    getSettings() {
      return {
        providerTypes: llm.listProviderTypes(),
        connections: connections.map(safeConnection),
        default: defaultValue,
      };
    },
    getDefault() {
      return defaultValue;
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
      if (index < 0) throw new Error(`LLM connection not found: ${id}`);
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
      const nextDefault =
        defaultValue?.connectionId === id
          ? {
              connectionId: id,
              modelId: updated.modelIds.includes(defaultValue.modelId)
                ? defaultValue.modelId
                : updated.modelIds[0]!,
            }
          : defaultValue;
      persist(next, nextDefault);
      connections = next;
      defaultValue = nextDefault;
      register(updated, true);
      return safeConnection(updated);
    },
    deleteConnection(id: string) {
      const next = connections.filter((item) => item.id !== id);
      if (next.length === connections.length)
        throw new Error(`LLM connection not found: ${id}`);
      const nextDefault =
        defaultValue?.connectionId === id ? null : defaultValue;
      persist(next, nextDefault);
      connections = next;
      defaultValue = nextDefault;
      llm.deleteClient(id);
      return { id };
    },
    setDefault(value: { connectionId: string; modelId: string }) {
      const connection = connections.find(
        (item) => item.id === value.connectionId,
      );
      if (!connection || !connection.modelIds.includes(value.modelId))
        throw new Error(
          "Default must reference a configured connection and model",
        );
      persist(connections, value);
      defaultValue = value;
      return value;
    },
    registerConfiguredConnections() {
      for (const connection of connections) register(connection);
    },
  };
}

export type LLMConnectionService = ReturnType<
  typeof createLLMConnectionService
>;
