import { BrowserWindow } from "electron";
import { desktopConfig, desktopInfoArg } from "../config";
import { applyWindowSecurity } from "./window-security";

export async function createMainWindow(
  serverUrl: string,
): Promise<BrowserWindow> {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: desktopConfig.preloadPath,
      additionalArguments: [desktopInfoArg(serverUrl), "--cloudy-window=main"],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  applyWindowSecurity(win, serverUrl);
  win.once("ready-to-show", () => {
    if (!win.isDestroyed()) win.show();
  });
  try {
    await win.loadURL(
      desktopConfig.isDev ? desktopConfig.devServerUrl : serverUrl,
    );
    return win;
  } catch (error) {
    if (!win.isDestroyed()) win.destroy();
    throw error;
  }
}

export function focusWindow(win: BrowserWindow): void {
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}
