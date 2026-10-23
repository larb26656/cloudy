import { app } from "electron";
import { join } from "node:path";
import { createDesktopApp } from "./app";
import { desktopConfig } from "./config";

if (desktopConfig.isDev) {
  app.setPath("userData", join(app.getPath("appData"), "Cloudy Desktop Dev"));
}

function showDockIcon(): void {
  if (process.platform === "darwin") app.dock?.show();
}

const desktop = createDesktopApp();

if (!app.requestSingleInstanceLock()) {
  console.warn(
    "another cloudy desktop instance holds the single-instance lock (is Cloudy.app or another dev session running?) — exiting",
  );
  app.quit();
} else {
  app.on("second-instance", () => {
    showDockIcon();
    void desktop.showMainWindow();
  });
  app.on("activate", () => {
    showDockIcon();
    void desktop.showMainWindow();
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("before-quit", (event) => {
    if (desktop.isQuitting) return;
    event.preventDefault();
    void desktop.shutdown().finally(() => app.exit(0));
  });

  app
    .whenReady()
    .then(async () => {
      await desktop.start();
      showDockIcon();
    })
    .catch((error: unknown) => {
      console.error(error);
      app.exit(1);
    });
}
