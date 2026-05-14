import { homedir } from "node:os";
import { resolve } from "node:path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

export type ServerMode = "local" | "remote";

export interface LocalServerConfig {
  host: string;
  port: number;
}

export interface RemoteServerConfig {
  endpoint: string;
}

export interface DesktopConfig {
  server: {
    mode: ServerMode;
    local: LocalServerConfig;
    remote: RemoteServerConfig;
  };
}

const DEFAULT_CONFIG: DesktopConfig = {
  server: {
    mode: "local",
    local: {
      host: "localhost",
      port: 3000,
    },
    remote: {
      endpoint: "",
    },
  },
};

function expanduser(path: string): string {
  if (path.startsWith("~/") || path === "~") {
    return path.replace("~", homedir());
  }
  return path;
}

function resolveConfigDir(): string {
  return expanduser("~/.config/cloudy");
}

export function getDefaultDesktopConfig(): DesktopConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

export function loadDesktopConfig(): DesktopConfig {
  const configDir = resolveConfigDir();
  const configPath = resolve(configDir, "desktop.json");

  if (!existsSync(configPath)) {
    mkdirSync(configDir, { recursive: true });
    const defaultConfig = getDefaultDesktopConfig();
    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }

  try {
    const raw = JSON.parse(readFileSync(configPath, "utf8"));
    const config: DesktopConfig = {
      server: {
        mode: raw.server?.mode || "local",
        local: {
          host: raw.server?.local?.host || "localhost",
          port: raw.server?.local?.port || 3000,
        },
        remote: {
          endpoint: raw.server?.remote?.endpoint || "",
        },
      },
    };
    return config;
  } catch {
    return getDefaultDesktopConfig();
  }
}

export function saveDesktopConfig(config: DesktopConfig): void {
  const configDir = resolveConfigDir();
  const configPath = resolve(configDir, "desktop.json");
  mkdirSync(configDir, { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function getServerUrl(config: DesktopConfig): string {
  if (config.server.mode === "local") {
    const { host, port } = config.server.local;
    return `http://${host}:${port}`;
  }
  return config.server.remote.endpoint;
}