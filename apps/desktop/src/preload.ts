import { contextBridge, ipcRenderer } from "electron";

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

contextBridge.exposeInMainWorld("electronAPI", { context: contextAPI });
