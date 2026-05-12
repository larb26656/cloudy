import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { startHub } from './hub';

const devClientServer = process.env.DEV_CLIENT_SERVER_URL;

if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

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

  const { store } = startHub(mainWindow);

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
};

app.on('ready', createWindow);

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
