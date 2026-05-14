import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { startHub } from './hub';
import { createServer } from '@cloudy/server';
import {
  loadDesktopConfig,
  saveDesktopConfig,
  getServerUrl,
  type DesktopConfig,
} from './config';

type ServerStatus = {
  running: boolean;
  url?: string;
};

let serverStatus: ServerStatus = { running: false };
let serverInstance: ReturnType<typeof createServer> | null = null;
let desktopConfig: DesktopConfig;

const devClientServer = process.env.DEV_CLIENT_SERVER_URL;

if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const startServerIfNeeded = async () => {
  if (desktopConfig.server.mode === "local") {
    const { host, port } = desktopConfig.server.local;
    try {
      serverInstance = createServer({
        host,
        port,
        corsOrigins: ['*'],
        enableUI: true,
      });
      const { url } = await serverInstance.start();
      serverStatus = { running: true, url };
      console.log(`Cloudy server started on ${url}`);
    } catch (error) {
      console.error('Failed to auto-start server:', error);
    }
  }
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (devClientServer) {
    mainWindow.loadURL(devClientServer);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  const { store } = startHub(mainWindow, () => desktopConfig);

  ipcMain.handle('context:list', () => {
    return store.list();
  });

  ipcMain.handle('context:add', (_event, options: { type: string; data: unknown; replace?: boolean }) => {
    return store.add(options);
  });

  ipcMain.handle('context:remove', (_event, id: string) => {
    return store.remove(id);
  });

  ipcMain.handle('context:clear', () => {
    store.clear();
    return true;
  });

  ipcMain.handle('server:start', async (_event, config: {
    host?: string;
    port?: number;
  }) => {
    if (serverStatus.running) {
      return { error: 'Server already running', status: serverStatus };
    }

    try {
      serverInstance = createServer({
        host: config.host,
        port: config.port,
        corsOrigins: ['*'],
        enableUI: true,
      });

      const { url } = await serverInstance.start();
      serverStatus = { running: true, url };

      console.log(`Cloudy server started on ${url}`);
      return { status: serverStatus };
    } catch (error) {
      console.error('Failed to start server:', error);
      return { error: String(error), status: serverStatus };
    }
  });

  ipcMain.handle('server:stop', async () => {
    if (!serverStatus.running || !serverInstance) {
      return { error: 'Server not running', status: serverStatus };
    }

    try {
      await serverInstance.stop();
      serverStatus = { running: false };
      serverInstance = null;
      console.log('Cloudy server stopped');
      return { status: serverStatus };
    } catch (error) {
      console.error('Failed to stop server:', error);
      return { error: String(error), status: serverStatus };
    }
  });

  ipcMain.handle('server:status', () => {
    return { status: serverStatus };
  });

  ipcMain.handle('config:load', () => {
    return desktopConfig;
  });

  ipcMain.handle('config:save', (_event, newConfig: DesktopConfig) => {
    desktopConfig = newConfig;
    saveDesktopConfig(desktopConfig);
    return desktopConfig;
  });
};

app.on('ready', async () => {
  desktopConfig = loadDesktopConfig();
  await startServerIfNeeded();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
