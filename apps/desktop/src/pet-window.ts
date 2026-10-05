import { app, BrowserWindow, ipcMain, Menu, screen, shell } from "electron";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const COLLAPSED_WIDTH = 144;
const COLLAPSED_HEIGHT = 160;
const DEFAULT_MARGIN = 64;
const PERSIST_DEBOUNCE_MS = 500;
const MAX_SIZE = 2000;

const PET_IPC_CHANNELS = [
  "pet:drag-start",
  "pet:drag-move",
  "pet:drag-end",
  "pet:set-size",
  "pet:focus-main",
  "pet:open-session",
  "pet:context-menu",
  "pet:show",
] as const;

const PET_VISIBILITY_CHANNEL = "pet:visibility";

/** Serializable "open this session as a tab" payload relayed to the main window. */
export type SessionTabPayload = { type: string; data: unknown };

export type PetWindowOptions = {
  isDev: boolean;
  serverUrl: string;
  devServerUrl: string;
  preloadPath: string;
  desktopInfoArg: string;
  isAppOrigin: (target: string) => boolean;
  /** Creates (or returns) the main window; used by pet → main focus/relay IPC. */
  ensureMainWindow: () => Promise<BrowserWindow | null>;
};

let petWindow: BrowserWindow | null = null;
let dragOffset: { x: number; y: number } | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let positionDirty = false;

function petStatePath(): string {
  return join(app.getPath("userData"), "pet-window.json");
}

function readSavedPosition(): { x: number; y: number } | null {
  try {
    const parsed = JSON.parse(readFileSync(petStatePath(), "utf8")) as {
      x?: unknown;
      y?: unknown;
    };
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") {
      return null;
    }
    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
}

function clampToWorkArea(
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const { workArea } = screen.getDisplayMatching({ x, y, width, height });
  return {
    x: Math.min(
      Math.max(x, workArea.x),
      workArea.x + Math.max(0, workArea.width - width),
    ),
    y: Math.min(
      Math.max(y, workArea.y),
      workArea.y + Math.max(0, workArea.height - height),
    ),
  };
}

function defaultPosition(): { x: number; y: number } {
  const { workArea } = screen.getPrimaryDisplay();
  return {
    x: workArea.x + workArea.width - COLLAPSED_WIDTH - DEFAULT_MARGIN,
    y: workArea.y + workArea.height - COLLAPSED_HEIGHT - DEFAULT_MARGIN,
  };
}

function flushPosition(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!positionDirty || !petWindow) return;
  positionDirty = false;
  const [x = 0, y = 0] = petWindow.getPosition();
  try {
    writeFileSync(petStatePath(), JSON.stringify({ x, y }), "utf8");
  } catch (error) {
    console.warn("cloudy: failed to persist pet window position", error);
  }
}

function schedulePositionSave(): void {
  positionDirty = true;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    flushPosition();
  }, PERSIST_DEBOUNCE_MS);
}

function petWindowFor(event: Electron.IpcMainEvent): BrowserWindow | null {
  const win = petWindow;
  return win && !win.isDestroyed() && event.sender === win.webContents
    ? win
    : null;
}

function removePetIpcListeners(): void {
  for (const channel of PET_IPC_CHANNELS) {
    ipcMain.removeAllListeners(channel);
  }
  ipcMain.removeHandler("pet:get-visibility");
}

function isValidSize(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_SIZE
  );
}

function focusMainWindow(options: PetWindowOptions): void {
  void (async () => {
    const main = await options.ensureMainWindow();
    if (!main || main.isDestroyed()) return;
    if (main.isMinimized()) main.restore();
    main.focus();
  })();
}

async function mainWindowFor(
  options: PetWindowOptions,
  event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent,
): Promise<BrowserWindow | null> {
  const main = await options.ensureMainWindow();
  return main && !main.isDestroyed() && event.sender === main.webContents
    ? main
    : null;
}

function broadcastVisibility(
  options: PetWindowOptions,
  visible: boolean,
): void {
  void (async () => {
    const main = await options.ensureMainWindow();
    if (!main || main.isDestroyed()) return;
    main.webContents.send(PET_VISIBILITY_CHANNEL, visible);
  })();
}

function hidePetWindow(options: PetWindowOptions): void {
  const win = petWindow;
  if (!win || win.isDestroyed()) return;
  win.hide();
  broadcastVisibility(options, false);
}

function showPetWindow(options: PetWindowOptions): void {
  const win = petWindow;
  if (!win || win.isDestroyed()) return;
  win.showInactive();
  broadcastVisibility(options, true);
}

function registerPetIpc(options: PetWindowOptions): void {
  ipcMain.on("pet:drag-start", (event) => {
    const win = petWindowFor(event);
    if (!win) return;
    const cursor = screen.getCursorScreenPoint();
    const [x = 0, y = 0] = win.getPosition();
    dragOffset = { x: cursor.x - x, y: cursor.y - y };
  });

  ipcMain.on("pet:drag-move", (event) => {
    const win = petWindowFor(event);
    if (!win || !dragOffset) return;
    const cursor = screen.getCursorScreenPoint();
    win.setPosition(cursor.x - dragOffset.x, cursor.y - dragOffset.y, false);
  });

  ipcMain.on("pet:drag-end", (event) => {
    if (!petWindowFor(event)) return;
    dragOffset = null;
    schedulePositionSave();
  });

  ipcMain.on(
    "pet:set-size",
    (event, size: { width?: unknown; height?: unknown } | undefined) => {
      const win = petWindowFor(event);
      if (!win || !size) return;
      const width = Math.round(Number(size.width));
      const height = Math.round(Number(size.height));
      if (!isValidSize(width) || !isValidSize(height)) return;
      const bounds = win.getBounds();
      const position = clampToWorkArea(
        bounds.x + bounds.width - width,
        bounds.y + bounds.height - height,
        width,
        height,
      );
      win.setBounds({ x: position.x, y: position.y, width, height });
    },
  );

  ipcMain.on("pet:focus-main", (event) => {
    if (!petWindowFor(event)) return;
    focusMainWindow(options);
  });

  ipcMain.on(
    "pet:open-session",
    (event, payload: SessionTabPayload | undefined) => {
      if (!petWindowFor(event)) return;
      if (
        !payload ||
        typeof payload !== "object" ||
        typeof payload.type !== "string"
      ) {
        return;
      }
      void (async () => {
        const main = await options.ensureMainWindow();
        if (!main || main.isDestroyed()) return;
        if (main.isMinimized()) main.restore();
        main.focus();
        main.webContents.send("pet:open-session", payload);
      })();
    },
  );

  ipcMain.on("pet:context-menu", (event) => {
    const win = petWindowFor(event);
    if (!win) return;
    Menu.buildFromTemplate([
      {
        label: "Hide pet",
        click: () => hidePetWindow(options),
      },
    ]).popup({ window: win });
  });

  ipcMain.on("pet:show", (event) => {
    void (async () => {
      if (!(await mainWindowFor(options, event))) return;
      showPetWindow(options);
    })();
  });

  ipcMain.handle("pet:get-visibility", async (event) => {
    if (!(await mainWindowFor(options, event))) return false;
    const win = petWindow;
    return win !== null && !win.isDestroyed() && win.isVisible();
  });
}

/**
 * Creates the desktop pet overlay window: transparent, frameless,
 * always-on-top, loading the web-app's `/pet` route. Position is restored
 * from `userData/pet-window.json` (clamped to a visible display) — never
 * localStorage, because the embedded server's port changes every launch.
 */
export async function createPetWindow(
  options: PetWindowOptions,
): Promise<BrowserWindow> {
  const saved = readSavedPosition();
  const desired = saved ?? defaultPosition();
  const { x, y } = clampToWorkArea(
    desired.x,
    desired.y,
    COLLAPSED_WIDTH,
    COLLAPSED_HEIGHT,
  );

  const win = new BrowserWindow({
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    roundedCorners: false,
    show: false,
    backgroundColor: "#00000000",
    width: COLLAPSED_WIDTH,
    height: COLLAPSED_HEIGHT,
    x,
    y,
    webPreferences: {
      preload: options.preloadPath,
      additionalArguments: [options.desktopInfoArg, "--cloudy-window=pet"],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  petWindow = win;

  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!options.isAppOrigin(url)) void shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (!options.isAppOrigin(url)) event.preventDefault();
  });

  win.once("ready-to-show", () => {
    if (!win.isDestroyed()) win.showInactive();
  });

  win.on("closed", () => {
    if (petWindow === win) petWindow = null;
    removePetIpcListeners();
  });

  registerPetIpc(options);

  await win.loadURL(
    `${options.isDev ? options.devServerUrl : options.serverUrl}/pet`,
  );
  return win;
}

/** Flushes the persisted position and destroys the overlay (quit path). */
export function destroyPetWindow(): void {
  flushPosition();
  removePetIpcListeners();
  dragOffset = null;
  petWindow?.destroy();
  petWindow = null;
}
