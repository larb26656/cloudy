import { camelToSnake } from "../lib/utils";
import { AppConfig, ConfigurableSchema } from "./config";

export const CONFIG_PREFIX = "CLOUDY_";

export function getConfigEnvKey(key: string) {
  return `${CONFIG_PREFIX}${camelToSnake(key)}`;
}

export function loadEnvConfig(): Partial<AppConfig> {
  return Object.fromEntries(
    Object.entries(ConfigurableSchema.shape).map(([key]) => {
      const envKey = getConfigEnvKey(key);
      return [key, process.env[envKey]];
    }),
  ) as Partial<AppConfig>;
}
