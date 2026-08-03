import z from "zod";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const BASE_CONFIG_DIR = "~/.config/cloudy";

export const ConfigurableSchema = z.object({
  configDir: z.string(),
  configPath: z.string(),
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
    .transform((val) => (val ? val.split(",").map((o) => o.trim()) : [])),
  opencodeApiBase: z.string().default("http://localhost:4096"),
});

export type CloudyConfig = z.infer<typeof ConfigurableSchema>;

type AppConfig = z.input<typeof ConfigurableSchema>;

function expanduser(path: string): string {
  if (path.startsWith("~/") || path === "~") {
    return path.replace("~", homedir());
  }

  return path;
}

export function camelToSnake(str: string): string {
  return str
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .toUpperCase();
}

export function getEnvConfig(): Partial<AppConfig> {
  return Object.fromEntries(
    Object.entries(ConfigurableSchema.shape).map(([key]) => {
      const envKey = `CLOUDY_${camelToSnake(key)}`;
      return [key, process.env[envKey]];
    }),
  ) as Partial<AppConfig>;
}

export function resolveConfigDir(overrideConfigDir?: string): string {
  if (overrideConfigDir) {
    return expanduser(overrideConfigDir);
  }

  return expanduser(BASE_CONFIG_DIR);
}

/**
 * Side effect: make sure `config.json` exists in `configDir`, writing a small
 * default file on first run. Returns the absolute path of the config file the
 * caller should subsequently read with {@link parseConfig}.
 *
 * Split out of {@link parseConfig} so the pure parse stays side-effect-free.
 */
export function ensureConfigFile(
  configDir: string,
  defaults: object = { host: "localhost", port: "4122" },
): string {
  const configPath = resolve(configDir, "config.json");
  if (!existsSync(configPath)) {
    mkdirSync(configDir, { recursive: true });
    writeFileSync(configPath, JSON.stringify(defaults, null, 2));
  }
  return configPath;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripUndefined(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  );
}

/**
 * Pure config merge + parse. Layered resolution order (later wins):
 * schema defaults → config file → env (`CLOUDY_*`) → explicit CLI flags.
 * Does not touch the filesystem — call {@link ensureConfigFile} first to
 * materialise the config file path.
 */
export function parseConfig(input: {
  configPath: string;
  configDir: string;
  cliFlags?: Partial<AppConfig>;
}): CloudyConfig {
  const dbPath =
    input?.cliFlags?.dbPath != null
      ? expanduser(input?.cliFlags?.dbPath)
      : path.join(input.configDir, "cloud.db");

  const defaults = ConfigurableSchema.parse({
    configDir: input.configDir,
    configPath: input.configPath,
    dbPath,
  });
  const fileConfig = ConfigurableSchema.partial().parse(
    JSON.parse(readFileSync(input.configPath, "utf8")),
  );
  const envConfig = getEnvConfig();
  const filteredCliFlags = Object.fromEntries(
    Object.entries(input.cliFlags ?? {}).filter(([, v]) => v !== undefined),
  );
  const mergedInput = {
    ...defaults,
    ...stripUndefined(fileConfig),
    ...stripUndefined(envConfig),
    ...stripUndefined(filteredCliFlags),
  };

  const merged = ConfigurableSchema.parse(mergedInput);

  return merged;
}

/**
 * Convenience: ensure the config file exists, then parse it. Kept for callers
 * that don't need to inspect the file path; new code should prefer
 * `ensureConfigFile` + `parseConfig` directly.
 */
export function loadConfig(cliFlags: Partial<AppConfig> = {}): CloudyConfig {
  const configDir = resolveConfigDir(cliFlags.configDir as string | undefined);
  const configPath = ensureConfigFile(configDir);
  return parseConfig({ configPath, configDir, cliFlags });
}
