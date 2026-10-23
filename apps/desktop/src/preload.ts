import { contextBridge, ipcRenderer } from "electron";

const DESKTOP_MARKER = "--cloudy-desktop=";
const WINDOW_MARKER = "--cloudy-window=";
const OPEN_SESSION_CHANNEL = "pet:open-session";
const VISIBILITY_CHANNEL = "pet:visibility";

type WindowKind = "main" | "pet" | "quick";

type SessionTabPayload = { type: string; data: unknown };

type PetBridgeApi = {
  dragStart(): void;
  dragMove(screenX: number, screenY: number): void;
  dragEnd(): void;
  setSize(width: number, height: number): void;
  focusMain(): void;
  openSession(payload: SessionTabPayload): void;
  onOpenSession(callback: (payload: SessionTabPayload) => void): () => void;
  showContextMenu(): void;
  show(): void;
  hide(): void;
  getVisibility(): Promise<boolean>;
  onVisibility(callback: (visible: boolean) => void): () => void;
};

type QuickBridgeApi = {
  hide(): void;
  openSession(payload: SessionTabPayload): void;
  setHeight(height: number): void;
  onFocusInput(callback: () => void): () => void;
};

type DesktopInfo = {
  apiUrl: string;
  isDev: boolean;
  platform: string;
  windowKind?: WindowKind;
  petBridge?: PetBridgeApi;
  quickBridge?: QuickBridgeApi;
};

let info: DesktopInfo | null = null;
let windowKind: WindowKind | undefined;

for (const arg of process.argv) {
  if (arg.startsWith(DESKTOP_MARKER)) {
    try {
      info = JSON.parse(arg.slice(DESKTOP_MARKER.length)) as DesktopInfo;
    } catch {
      info = null;
    }
  } else if (arg.startsWith(WINDOW_MARKER)) {
    const kind = arg.slice(WINDOW_MARKER.length);
    if (kind === "main" || kind === "pet" || kind === "quick")
      windowKind = kind;
  }
}

function onOpenSession(
  callback: (payload: SessionTabPayload) => void,
): () => void {
  const listener = (
    _event: Electron.IpcRendererEvent,
    payload: SessionTabPayload,
  ) => callback(payload);
  ipcRenderer.on(OPEN_SESSION_CHANNEL, listener);
  return () => {
    ipcRenderer.removeListener(OPEN_SESSION_CHANNEL, listener);
  };
}

function onVisibility(callback: (visible: boolean) => void): () => void {
  const listener = (_event: Electron.IpcRendererEvent, visible: boolean) =>
    callback(visible);
  ipcRenderer.on(VISIBILITY_CHANNEL, listener);
  return () => {
    ipcRenderer.removeListener(VISIBILITY_CHANNEL, listener);
  };
}

function createPetBridge(): PetBridgeApi {
  return {
    dragStart: () => ipcRenderer.send("pet:drag-start"),
    dragMove: () => ipcRenderer.send("pet:drag-move"),
    dragEnd: () => ipcRenderer.send("pet:drag-end"),
    setSize: (width, height) =>
      ipcRenderer.send("pet:set-size", { width, height }),
    focusMain: () => ipcRenderer.send("pet:focus-main"),
    openSession: (payload) => ipcRenderer.send("pet:open-session", payload),
    onOpenSession,
    showContextMenu: () => ipcRenderer.send("pet:context-menu"),
    show: () => ipcRenderer.send("pet:show"),
    hide: () => ipcRenderer.send("pet:hide"),
    getVisibility: () => ipcRenderer.invoke("pet:get-visibility"),
    onVisibility,
  };
}

function createQuickBridge(): QuickBridgeApi {
  return {
    hide: () => ipcRenderer.send("quick:hide"),
    openSession: (payload) => ipcRenderer.send("quick:open-session", payload),
    setHeight: (height) => ipcRenderer.send("quick:set-height", height),
    onFocusInput: (callback) => {
      const listener = () => callback();
      ipcRenderer.on("quick:focus-input", listener);
      return () => ipcRenderer.removeListener("quick:focus-input", listener);
    },
  };
}

if (info) {
  info.windowKind = windowKind;
  info.petBridge = createPetBridge();
  if (windowKind === "quick") info.quickBridge = createQuickBridge();
  contextBridge.exposeInMainWorld("__CLOUDY_DESKTOP__", info);
}
