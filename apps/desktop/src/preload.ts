import { contextBridge, ipcRenderer } from "electron";

export interface ElectronServerAPI {
  start: (config: {
    host?: string;
    port?: number;
  }) => Promise<{
    status?: { running: boolean; url?: string };
    error?: string;
  }>;
  stop: () => Promise<{
    status?: { running: boolean; url?: string };
    error?: string;
  }>;
  status: () => Promise<{
    status: { running: boolean; url?: string };
  }>;
}

export interface ElectronContextAPI {
  addContext: (options: {
    type: string;
    data: unknown;
    replace?: boolean;
  }) => Promise<{ status: "added" | "replaced"; id: string }>;
  removeContext: (id: string) => Promise<boolean>;
  clearContexts: () => Promise<boolean>;
  listContexts: () => Promise<
    Array<{
      id: string;
      type: string;
      data: unknown;
      replace: boolean;
      timestamp: string;
    }>
  >;
  onContextUpdate: (
    callback: (event: {
      action: "added" | "removed" | "cleared";
      item?: {
        id: string;
        type: string;
        data: unknown;
        replace: boolean;
        timestamp: string;
      };
      contexts: Array<{
        id: string;
        type: string;
        data: unknown;
        replace: boolean;
        timestamp: string;
      }>;
    }) => void,
  ) => () => void;
}

export interface ElectronConfigAPI {
  load: () => Promise<DesktopConfig>;
  save: (config: DesktopConfig) => Promise<DesktopConfig>;
}

export interface DesktopConfig {
  server: {
    mode: "local" | "remote";
    local: {
      host: string;
      port: number;
    };
    remote: {
      endpoint: string;
    };
  };
}

const contextAPI: ElectronContextAPI = {
  addContext: (options) => ipcRenderer.invoke("context:add", options),
  removeContext: (id) => ipcRenderer.invoke("context:remove", id),
  clearContexts: () => ipcRenderer.invoke("context:clear"),
  listContexts: () => ipcRenderer.invoke("context:list"),
  onContextUpdate: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => {
      callback(data as Parameters<typeof callback>[0]);
    };
    ipcRenderer.on("context:update", handler);
    return () => {
      ipcRenderer.removeListener("context:update", handler);
    };
  },
};

const serverAPI: ElectronServerAPI = {
  start: (config) => ipcRenderer.invoke("server:start", config),
  stop: () => ipcRenderer.invoke("server:stop"),
  status: () => ipcRenderer.invoke("server:status"),
};

const configAPI: ElectronConfigAPI = {
  load: () => ipcRenderer.invoke("config:load"),
  save: (config) => ipcRenderer.invoke("config:save", config),
};

contextBridge.exposeInMainWorld("electronAPI", { context: contextAPI, server: serverAPI, config: configAPI });
