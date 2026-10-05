import { app, BrowserWindow, shell } from "electron";
import { createServer } from "@repo/server";
import net from "node:net";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createPetWindow, destroyPetWindow } from "./pet-window";

const isDev = !app.isPackaged;
const __dirname = dirname(fileURLToPath(import.meta.url));
const unpackedDistDir = __dirname.includes(`app.asar${sep}`)
  ? __dirname.replace(`app.asar${sep}`, `app.asar.unpacked${sep}`)
  : __dirname;
const DEV_SERVER_URL =
  process.env.CLOUDY_DESKTOP_DEV_URL ?? "http://localhost:3001";
const FIXED_PORT = 4222;
const HOST = "localhost";

function probePort(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => probe.close(() => resolve(true)));
    probe.listen(port, host);
  });
}

let mainWindow: BrowserWindow | null = null;
let stopServer: (() => Promise<void>) | null = null;
let serverUrl: string | null = null;
let quitting = false;

function isAppOrigin(target: string): boolean {
  const allowed = new Set<string>([
    ...(serverUrl ? [new URL(serverUrl).origin] : []),
    ...(isDev ? [new URL(DEV_SERVER_URL).origin] : []),
  ]);
  try {
    return allowed.has(new URL(target).origin);
  } catch {
    return false;
  }
}

function desktopInfoArg(): string {
  return `--cloudy-desktop=${JSON.stringify({
    apiUrl: serverUrl,
    isDev,
    platform: process.platform,
  })}`;
}

async function createWindow() {
  if (!serverUrl) return;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      additionalArguments: [desktopInfoArg(), "--cloudy-window=main"],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAppOrigin(url)) void shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAppOrigin(url)) event.preventDefault();
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(isDev ? DEV_SERVER_URL : serverUrl);
}

async function ensureMainWindow(): Promise<BrowserWindow | null> {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
  if (!serverUrl) return null;
  await createWindow();
  return mainWindow;
}

async function boot() {
  if (!isDev) process.chdir(unpackedDistDir);

  const fixedPortAvailable = await probePort(FIXED_PORT, HOST);
  if (!fixedPortAvailable) {
    console.warn(`port ${FIXED_PORT} is busy, falling back to a dynamic port`);
  }

  const server = createServer({
    port: fixedPortAvailable ? FIXED_PORT : 0,
    ui: !isDev,
    publicDir: isDev ? undefined : join(unpackedDistDir, "public"),
    configDir: isDev ? join(__dirname, "..", "config") : undefined,
  });

  const { url } = await server.start();
  serverUrl = url;
  stopServer = server.stop;
  console.log(`cloudy server listening on ${url}`);

  await createWindow();
  await createPetWindow({
    isDev,
    serverUrl: url,
    devServerUrl: DEV_SERVER_URL,
    preloadPath: join(__dirname, "preload.cjs"),
    desktopInfoArg: desktopInfoArg(),
    isAppOrigin,
    ensureMainWindow,
  });
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    void (async () => {
      const win = await ensureMainWindow();
      if (!win) return;
      if (win.isMinimized()) win.restore();
      win.focus();
    })();
  });

  app.on("activate", () => {
    if (!mainWindow) void createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin" && mainWindow === null) app.quit();
  });

  app.on("before-quit", (event) => {
    if (quitting) return;
    quitting = true;
    event.preventDefault();
    void (async () => {
      try {
        destroyPetWindow();
        mainWindow?.destroy();
        mainWindow = null;
        await stopServer?.();
      } finally {
        app.exit(0);
      }
    })();
  });

  app
    .whenReady()
    .then(boot)
    .catch((error) => {
      console.error(error);
      app.exit(1);
    });
}
