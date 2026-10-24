import { app } from "electron";
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { getNetworkAddresses } from "./network-addresses";

const mainDir = dirname(fileURLToPath(import.meta.url));
const unpackedDistDir = mainDir.includes(`app.asar${sep}`)
  ? mainDir.replace(`app.asar${sep}`, `app.asar.unpacked${sep}`)
  : mainDir;

type LanSettings = {
  enabled: boolean;
};

function lanSettingsPath(): string {
  return join(app.getPath("userData"), "lan-access.json");
}

function persistLanSettings(settings: LanSettings): void {
  mkdirSync(app.getPath("userData"), { recursive: true });
  writeFileSync(lanSettingsPath(), JSON.stringify(settings), { mode: 0o600 });
  chmodSync(lanSettingsPath(), 0o600);
}

function readLanSettings(): LanSettings {
  try {
    const parsed = JSON.parse(
      readFileSync(lanSettingsPath(), "utf8"),
    ) as Partial<LanSettings>;
    const settings = { enabled: parsed.enabled === true };
    persistLanSettings(settings);
    return settings;
  } catch {
    return { enabled: false };
  }
}

let lanSettings: LanSettings | null = null;

function getLanSettings(): LanSettings {
  lanSettings ??= readLanSettings();
  return lanSettings;
}

function saveLanSettings(): void {
  persistLanSettings(getLanSettings());
}

export const desktopConfig = {
  isDev: !app.isPackaged,
  mainDir,
  unpackedDistDir,
  devServerUrl: process.env.CLOUDY_DESKTOP_DEV_URL ?? "http://localhost:3001",
  fixedPort: 4222,
  get host() {
    return getLanSettings().enabled ? "0.0.0.0" : "localhost";
  },
  get lanEnabled() {
    return getLanSettings().enabled;
  },
  get networkAddresses() {
    return getNetworkAddresses(networkInterfaces());
  },
  setLanEnabled(enabled: boolean) {
    getLanSettings().enabled = enabled;
    saveLanSettings();
  },
  get preloadPath() {
    return join(mainDir, "preload.cjs");
  },
};

export function desktopInfoArg(serverUrl: string): string {
  return `--cloudy-desktop=${JSON.stringify({
    apiUrl: serverUrl,
    isDev: desktopConfig.isDev,
    platform: process.platform,
  })}`;
}
