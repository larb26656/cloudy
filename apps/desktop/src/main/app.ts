import { app, ipcMain } from "electron";
import { createPetWindow, destroyPetWindow } from "./windows/pet-window";
import { createQuickWindow, destroyQuickWindow } from "./windows/quick-window";
import { desktopConfig, desktopInfoArg } from "./config";
import { focusWindow, createMainWindow } from "./windows/main-window";
import { registerShortcuts, unregisterShortcuts } from "./shortcuts";
import { startDesktopServer } from "./server";

const STOP_TIMEOUT_MS = 5000;

export function createDesktopApp() {
  let server: Awaited<ReturnType<typeof startDesktopServer>> | null = null;
  let mainWindow: Awaited<ReturnType<typeof createMainWindow>> | null = null;
  let creatingMainWindow: Promise<Awaited<
    ReturnType<typeof createMainWindow>
  > | null> | null = null;
  let starting: Promise<void> | null = null;
  let shuttingDown: Promise<void> | null = null;
  let quitting = false;

  ipcMain.handle("network:get-state", async (event) => {
    if (!mainWindow || event.sender !== mainWindow.webContents || !server)
      return null;
    const addressUrl = desktopConfig.isDev
      ? new URL(desktopConfig.devServerUrl)
      : new URL(server.url);
    const response = await fetch(`${server.url}/api/lan/devices`);
    const { devices } = (await response.json()) as {
      devices: { id: string; name: string; createdAt: string }[];
    };
    return {
      enabled: desktopConfig.lanEnabled,
      devices,
      pairingUrls: desktopConfig.networkAddresses.map(({ type, address }) => ({
        type,
        url: `${addressUrl.protocol}//${address}:${addressUrl.port}/pair`,
      })),
    };
  });

  ipcMain.handle("network:set-enabled", (event, enabled: unknown) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) return false;
    if (typeof enabled !== "boolean") return false;
    desktopConfig.setLanEnabled(enabled);
    app.relaunch();
    app.quit();
    return true;
  });

  ipcMain.handle("network:create-pin", async (event) => {
    if (!mainWindow || event.sender !== mainWindow.webContents || !server)
      return null;
    const response = await fetch(`${server.url}/api/lan/pin`, {
      method: "POST",
    });
    if (!response.ok) return null;
    return (await response.json()) as { code: string; expiresAt: number };
  });

  ipcMain.handle("network:revoke-device", async (event, id: unknown) => {
    if (!mainWindow || event.sender !== mainWindow.webContents || !server)
      return false;
    if (typeof id !== "string") return false;
    const response = await fetch(
      `${server.url}/api/lan/devices/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    return response.ok;
  });

  async function disposeResources(): Promise<void> {
    unregisterShortcuts();
    destroyQuickWindow();
    destroyPetWindow();
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
    mainWindow = null;
    if (server) {
      const currentServer = server;
      server = null;
      let timer: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([
        currentServer.stop(),
        new Promise<void>((resolve) => {
          timer = setTimeout(resolve, STOP_TIMEOUT_MS);
        }),
      ]);
      if (timer) clearTimeout(timer);
    }
  }

  function ensureMainWindow() {
    if (mainWindow && !mainWindow.isDestroyed())
      return Promise.resolve(mainWindow);
    if (creatingMainWindow) return creatingMainWindow;
    if (!server || quitting) return Promise.resolve(null);
    const pending = createMainWindow(server.url)
      .then((win) => {
        mainWindow = win;
        win.once("closed", () => {
          if (mainWindow === win) mainWindow = null;
        });
        return win;
      })
      .finally(() => {
        if (creatingMainWindow === pending) creatingMainWindow = null;
      });
    creatingMainWindow = pending;
    return pending;
  }

  async function start(): Promise<void> {
    if (starting) return starting;
    starting = (async () => {
      server = await startDesktopServer();
      await ensureMainWindow();
      const options = {
        isDev: desktopConfig.isDev,
        serverUrl: server.url,
        devServerUrl: desktopConfig.devServerUrl,
        preloadPath: desktopConfig.preloadPath,
        desktopInfoArg: desktopInfoArg(server.url),
        ensureMainWindow,
      };
      await createPetWindow(options);
      await createQuickWindow(options);
      registerShortcuts();
    })().catch(async (error: unknown) => {
      quitting = true;
      await disposeResources();
      throw error;
    });
    return starting;
  }

  function shutdown(): Promise<void> {
    if (shuttingDown) return shuttingDown;
    quitting = true;
    shuttingDown = (async () => {
      await starting?.catch(() => undefined);
      await disposeResources();
    })();
    return shuttingDown;
  }

  async function showMainWindow(): Promise<void> {
    const win = await ensureMainWindow();
    if (win && !win.isDestroyed()) focusWindow(win);
  }

  return {
    start,
    shutdown,
    showMainWindow,
    get isQuitting() {
      return quitting;
    },
  };
}
