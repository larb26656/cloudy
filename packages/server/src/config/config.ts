import z from "zod";
import path from "node:path";
import { loadEnvConfig } from "./env-loader";
import { stripUndefined } from "../lib/utils/object";
import { loadFileConfig } from "./file-loader";

const BASE_CONFIG_DIR = "~/.config/cloudy";

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
  publicDir: z.string().optional(),
});

export type AppConfig = z.infer<typeof ConfigurableSchema>;
export type AppConfigInput = z.input<typeof ConfigurableSchema>;

export type AppOption = Partial<AppConfigInput> & {
  configDir?: string;
};

export function loadConfig(option?: AppOption): AppConfig {
  const configDir = option?.configDir ?? BASE_CONFIG_DIR;
  const fileConfig = loadFileConfig(configDir);
  const envConfig = loadEnvConfig();

  const merged = ConfigurableSchema.parse({
    dbPath: path.join(configDir, "cloud.db"),
    ...stripUndefined(fileConfig),
    ...stripUndefined(envConfig),
    ...stripUndefined(option ?? {}),
  });

  return merged;
}
