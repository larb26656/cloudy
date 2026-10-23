import { globalShortcut } from "electron";
import { toggleQuickWindow } from "../windows/quick-window";

export function registerShortcuts(): void {
  const shortcut =
    process.platform === "darwin" ? "Command+Shift+K" : "Control+Shift+K";
  if (!globalShortcut.register(shortcut, toggleQuickWindow)) {
    console.warn(`cloudy: failed to register ${shortcut}`);
  }
}

export function unregisterShortcuts(): void {
  globalShortcut.unregisterAll();
}
