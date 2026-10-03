import z, { prettifyError } from "zod";
import path from "node:path";
import { loadEnvConfig } from "./env-loader";
import { stripUndefined } from "../lib/utils/object";
import { expanduser, loadFileConfig } from "./file-loader";

const BASE_CONFIG_DIR = "~/.config/cloudy";

const ProviderConfigSchema = z.object({
  enabled: z.boolean().default(true),
  baseUrl: z.string().default("http://localhost:4096"),
});

const ProvidersConfigSchema = z.object({
  opencode: ProviderConfigSchema.default({
    enabled: true,
    baseUrl: "http://localhost:4096",
  }),
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
    opencode: { enabled: true, baseUrl: "http://localhost:4096" },
  }),
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
  const baseUrl = configuredProvider?.baseUrl ?? legacyBaseUrl;

  return {
    ...result.data,
    opencodeApiBase: baseUrl ?? result.data.opencodeApiBase,
    providers: {
      ...result.data.providers,
      opencode: {
        ...result.data.providers.opencode,
        ...configuredProvider,
        baseUrl: baseUrl ?? result.data.providers.opencode.baseUrl,
      },
    },
  };
}
