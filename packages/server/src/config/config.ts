import z, { prettifyError } from "zod";
import path from "node:path";
import { loadEnvConfig } from "./env-loader";
import { stripUndefined } from "../lib/utils/object";
import { expanduser, loadFileConfig } from "./file-loader";

const BASE_CONFIG_DIR = "~/.config/cloudy";

const ProviderConfigSchema = z.object({
  id: z.string().default("opencode"),
  name: z.string().default("OpenCode"),
  templateId: z.literal("opencode").default("opencode"),
  enabled: z.boolean().default(true),
  baseUrl: z.string().default("http://localhost:4096"),
});

const ProvidersConfigSchema = z.object({
  instances: z.array(ProviderConfigSchema).default([
    {
      id: "opencode",
      name: "OpenCode",
      templateId: "opencode",
      enabled: true,
      baseUrl: "http://localhost:4096",
    },
  ]),
  opencode: ProviderConfigSchema.default({
    id: "opencode",
    name: "OpenCode",
    templateId: "opencode",
    enabled: true,
    baseUrl: "http://localhost:4096",
  }),
});

const LLMConnectionSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.string().min(1),
    config: z.record(z.string(), z.unknown()).optional(),
    apiKey: z.string().optional(),
    baseURL: z.string().optional(),
    modelIds: z.array(z.string().min(1)).optional(),
    modelId: z.string().min(1).optional(),
  })
  .transform(
    ({ modelIds, modelId, config, apiKey, baseURL, ...connection }) => ({
      ...connection,
      modelIds: modelIds ?? (modelId ? [modelId] : []),
      config: config ?? {
        ...(apiKey ? { apiKey } : {}),
        ...(baseURL ? { baseURL } : {}),
      },
    }),
  );

const AgentConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  systemPrompt: z.string(),
});

export const ConfigurableSchema = z.object({
  dbPath: z.string(),
  ui: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true")
    .default(false),
  host: z.string().default("localhost"),
  port: z.coerce.number().default(4122),
  cors: z
    .string()
    .default("")
    .transform((val) => {
      if (!val) {
        return undefined;
      }

      if (val === "*") {
        return "*";
      }

      return val.split(",").map((o) => o.trim());
    }),
  opencodeApiBase: z.string().default("http://localhost:4096"),
  providers: ProvidersConfigSchema.default({
    instances: [
      {
        id: "opencode",
        name: "OpenCode",
        templateId: "opencode",
        enabled: true,
        baseUrl: "http://localhost:4096",
      },
    ],
    opencode: {
      id: "opencode",
      name: "OpenCode",
      templateId: "opencode",
      enabled: true,
      baseUrl: "http://localhost:4096",
    },
  }),
  llm: z
    .object({
      connections: z.array(LLMConnectionSchema).default([]),
    })
    .default({ connections: [] }),
  agents: z.array(AgentConfigSchema).default([]),
  publicDir: z.string().optional(),
  tempWorkspaceDir: z.string(),
  extensionWorkspaceDir: z.string(),
});

export type AppConfig = z.infer<typeof ConfigurableSchema>;
export type AppConfigInput = z.input<typeof ConfigurableSchema>;

export type AppOption = Partial<AppConfigInput> & {
  configDir?: string;
};

export function resolveConfigDir(option?: AppOption): string {
  return expanduser(option?.configDir ?? BASE_CONFIG_DIR);
}

export function loadConfig(option?: AppOption): AppConfig {
  const configDir = resolveConfigDir(option);
  const fileConfig = loadFileConfig(configDir);
  const envConfig = loadEnvConfig();

  const result = ConfigurableSchema.safeParse({
    dbPath: path.join(configDir, "cloud.db"),
    tempWorkspaceDir: path.join(configDir, "workspaces"),
    extensionWorkspaceDir: path.join(configDir, "extensions"),
    ...stripUndefined(fileConfig),
    ...stripUndefined(envConfig),
    ...stripUndefined(option ?? {}),
  });

  if (!result.success) {
    throw new Error(`Invalid configuration:\n${prettifyError(result.error)}`);
  }

  const configuredProvider =
    (fileConfig.providers as AppConfigInput["providers"] | undefined)
      ?.opencode ??
    (option?.providers as AppConfigInput["providers"] | undefined)?.opencode;
  const legacyBaseUrl =
    option?.opencodeApiBase ??
    envConfig.opencodeApiBase ??
    fileConfig.opencodeApiBase;
  const configuredInstances = result.data.providers.instances;
  const baseUrl = configuredProvider?.baseUrl ?? legacyBaseUrl;
  const instances =
    configuredInstances.length > 0
      ? configuredInstances.map((instance) =>
          instance.id === "opencode" && configuredProvider
            ? {
                ...instance,
                ...configuredProvider,
                id: configuredProvider.id ?? instance.id,
                name: configuredProvider.name ?? instance.name,
                templateId: "opencode" as const,
                enabled: configuredProvider.enabled ?? instance.enabled,
                baseUrl: baseUrl ?? instance.baseUrl,
              }
            : instance,
        )
      : [
          {
            id: "opencode",
            name: "OpenCode",
            templateId: "opencode" as const,
            enabled: true,
            baseUrl: baseUrl ?? "http://localhost:4096",
          },
        ];

  return {
    ...result.data,
    opencodeApiBase: baseUrl ?? result.data.opencodeApiBase,
    providers: {
      ...result.data.providers,
      instances,
      opencode: {
        ...configuredProvider,
        id: "opencode",
        name: "OpenCode",
        templateId: "opencode",
        enabled: configuredProvider?.enabled ?? instances[0]?.enabled ?? true,
        baseUrl:
          baseUrl ??
          configuredProvider?.baseUrl ??
          instances[0]?.baseUrl ??
          "http://localhost:4096",
      },
    },
  };
}
