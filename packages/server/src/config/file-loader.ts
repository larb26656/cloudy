import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";
import { AppConfig } from "./config";

export function expanduser(path: string): string {
  if (path.startsWith("~/") || path === "~") {
    return path.replace("~", homedir());
  }

  return path;
}

export function ensureConfigFile(
  configDir: string,
  defaults: Partial<AppConfig> = { host: "localhost", port: 4122 },
): string {
  const configPath = resolve(configDir, "config.json");
  if (!existsSync(configPath)) {
    mkdirSync(configDir, { recursive: true });
    writeFileSync(configPath, JSON.stringify(defaults, null, 2));
  }
  return configPath;
}

export function loadFileConfig(configDir: string): Partial<AppConfig> {
  const configPath = ensureConfigFile(expanduser(configDir));

  return JSON.parse(readFileSync(configPath, "utf8"));
}
