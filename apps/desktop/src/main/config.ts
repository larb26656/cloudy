import { app } from "electron";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const mainDir = dirname(fileURLToPath(import.meta.url));
const unpackedDistDir = mainDir.includes(`app.asar${sep}`)
  ? mainDir.replace(`app.asar${sep}`, `app.asar.unpacked${sep}`)
  : mainDir;

export const desktopConfig = {
  isDev: !app.isPackaged,
  mainDir,
  unpackedDistDir,
  devServerUrl: process.env.CLOUDY_DESKTOP_DEV_URL ?? "http://localhost:3001",
  fixedPort: 4222,
  host: "localhost",
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
