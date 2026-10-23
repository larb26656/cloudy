import { app } from "electron";
import { createDesktopApp } from "./app";

const desktop = createDesktopApp();

if (!app.requestSingleInstanceLock()) {
  console.warn(
    "another cloudy desktop instance holds the single-instance lock (is Cloudy.app or another dev session running?) — exiting",
  );
  app.quit();
} else {
  app.on("second-instance", () => void desktop.showMainWindow());
  app.on("activate", () => void desktop.showMainWindow());
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
    .then(() => desktop.start())
    .catch((error: unknown) => {
      console.error(error);
      app.exit(1);
    });
}
