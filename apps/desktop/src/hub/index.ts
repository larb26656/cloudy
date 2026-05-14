import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createHubRouter } from "./server";
import { createProxyRoutes } from "./proxy";
import { HubContextStore } from "./context-store";
import type { BrowserWindow } from "electron";
import type { DesktopConfig } from "../config";

export function startHub(
  mainWindow: BrowserWindow,
  getConfig: () => DesktopConfig
) {
  const broadcast = (event: string, data: unknown) => {
    mainWindow.webContents.send(event, data);
  };

  const focusWindow = () => {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  };

  const store = new HubContextStore(broadcast, focusWindow);
  const hubApp = createHubRouter(store);
  const proxyApp = createProxyRoutes(getConfig);

  const app = new Hono().route("/", hubApp).route("/", proxyApp);

  const port = 4242;

  serve({
    fetch: app.fetch,
    port,
  });

  console.log(`Hub server listening on http://localhost:${port}`);

  return { store, app };
}
