import { shell, type BrowserWindow } from "electron";
import { desktopConfig } from "../config";

function isAppOrigin(target: string, serverUrl: string): boolean {
  try {
    const allowed = new Set([
      new URL(serverUrl).origin,
      ...(desktopConfig.isDev
        ? [new URL(desktopConfig.devServerUrl).origin]
        : []),
    ]);
    return allowed.has(new URL(target).origin);
  } catch {
    return false;
  }
}

function openExternalUrl(target: string): void {
  try {
    const url = new URL(target);
    if (url.protocol === "https:" || url.protocol === "mailto:") {
      void shell.openExternal(url.href);
    }
  } catch {
    return;
  }
}

export function applyWindowSecurity(
  win: BrowserWindow,
  serverUrl: string,
): void {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAppOrigin(url, serverUrl)) openExternalUrl(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!isAppOrigin(url, serverUrl)) event.preventDefault();
  });
}
