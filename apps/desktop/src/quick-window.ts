import { BrowserWindow, ipcMain, screen, shell } from "electron";

const CHANNELS = ["quick:hide", "quick:open-session"] as const;
const SESSION_CHANNEL = "pet:open-session";
const FOCUS_INPUT_CHANNEL = "quick:focus-input";

export type QuickSessionPayload = {
  type: "chat";
  data: {
    providerId: string;
    sessionId: string;
    workspaceId: string | null;
    directory: string;
    sessionName: string;
  };
};

export type QuickWindowOptions = {
  isDev: boolean;
  serverUrl: string;
  devServerUrl: string;
  preloadPath: string;
  desktopInfoArg: string;
  isAppOrigin: (target: string) => boolean;
  ensureMainWindow: () => Promise<BrowserWindow | null>;
};

let quickWindow: BrowserWindow | null = null;

function quickWindowFor(event: Electron.IpcMainEvent): BrowserWindow | null {
  return quickWindow &&
    !quickWindow.isDestroyed() &&
    event.sender === quickWindow.webContents
    ? quickWindow
    : null;
}

function validPayload(value: unknown): value is QuickSessionPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<QuickSessionPayload>;
  const data = payload.data;
  return (
    payload.type === "chat" &&
    !!data &&
    typeof data === "object" &&
    typeof data.sessionId === "string" &&
    typeof data.providerId === "string" &&
    typeof data.directory === "string" &&
    typeof data.sessionName === "string" &&
    (data.workspaceId === null || typeof data.workspaceId === "string")
  );
}

function removeHandlers() {
  for (const channel of CHANNELS) ipcMain.removeAllListeners(channel);
}

export async function createQuickWindow(options: QuickWindowOptions) {
  if (quickWindow && !quickWindow.isDestroyed()) return quickWindow;
  const point = screen.getCursorScreenPoint();
  const { workArea } = screen.getDisplayNearestPoint(point);
  const width = Math.min(680, workArea.width - 32);
  const height = Math.min(150, workArea.height - 32);
  const win = new BrowserWindow({
    width,
    height,
    x: Math.round(workArea.x + (workArea.width - width) / 2),
    y: Math.round(workArea.y + workArea.height * 0.22),
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    roundedCorners: true,
    webPreferences: {
      preload: options.preloadPath,
      additionalArguments: [options.desktopInfoArg, "--cloudy-window=quick"],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  quickWindow = win;
  win.setAlwaysOnTop(true, "floating");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!options.isAppOrigin(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!options.isAppOrigin(url)) event.preventDefault();
  });
  win.on("closed", () => {
    if (quickWindow === win) quickWindow = null;
    removeHandlers();
  });
  win.on("blur", () => win.hide());
  ipcMain.on("quick:hide", (event) => {
    if (quickWindowFor(event)) win.hide();
  });
  ipcMain.on("quick:open-session", (event, payload: unknown) => {
    if (!quickWindowFor(event) || !validPayload(payload)) return;
    void (async () => {
      const main = await options.ensureMainWindow();
      if (!main || main.isDestroyed()) return;
      if (main.isMinimized()) main.restore();
      main.focus();
      main.webContents.send(SESSION_CHANNEL, payload);
      win.hide();
    })();
  });
  await win.loadURL(
    `${options.isDev ? options.devServerUrl : options.serverUrl}/quick`,
  );
  return win;
}

export function toggleQuickWindow() {
  const win = quickWindow;
  if (!win || win.isDestroyed()) return;
  if (win.isVisible()) {
    win.hide();
    return;
  }
  const point = screen.getCursorScreenPoint();
  const { workArea } = screen.getDisplayNearestPoint(point);
  const [width] = win.getSize();
  win.setPosition(
    Math.round(workArea.x + (workArea.width - (width ?? 680)) / 2),
    Math.round(workArea.y + workArea.height * 0.22),
  );
  win.show();
  win.focus();
  win.webContents.send(FOCUS_INPUT_CHANNEL);
}

export function destroyQuickWindow() {
  removeHandlers();
  quickWindow?.destroy();
  quickWindow = null;
}
