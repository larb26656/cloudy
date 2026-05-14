import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'node:path'
import { loadDesktopConfig, saveDesktopConfig, type DesktopConfig } from './config'
import { startHub } from './hub'
import { createServer } from '@cloudy/server'

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  dialog.showErrorBox(
    'Application Error (Uncaught Exception)',
    error.stack || error.message || String(error)
  )
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
  dialog.showErrorBox(
    'Application Error (Unhandled Rejection)',
    String(reason)
  )
})

type ServerStatus = {
  running: boolean
  url?: string
}

let serverStatus: ServerStatus = { running: false }
let serverInstance: ReturnType<typeof createServer> | null = null
let desktopConfig: DesktopConfig

const devClientServer = process.env.DEV_CLIENT_SERVER_URL

let mainWindow: BrowserWindow | null = null

const startServerIfNeeded = async (): Promise<void> => {
  if (desktopConfig.server.mode === 'local') {
    const { host, port } = desktopConfig.server.local
    try {
      serverInstance = createServer({
        host,
        port,
        corsOrigins: ['*', 'http://localhost:3001'],
        enableUI: true,
        dbMigrationsDir: '../server/src/db/migrations',
      })
      const { url } = await serverInstance.start()
      serverStatus = { running: true, url }
      console.log(`Cloudy server started on ${url}`)
    } catch (error) {
      console.error('Failed to auto-start server:', error)
    }
  }
}

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  if (devClientServer) {
    mainWindow.loadURL(devClientServer)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  const { store } = startHub(mainWindow, () => desktopConfig)

  ipcMain.handle('context:list', () => {
    return store.list()
  })

  ipcMain.handle('context:add', (_event, options: { type: string; data: unknown; replace?: boolean }) => {
    return store.add(options)
  })

  ipcMain.handle('context:remove', (_event, id: string) => {
    return store.remove(id)
  })

  ipcMain.handle('context:clear', () => {
    store.clear()
    return true
  })

  ipcMain.handle('server:start', async (_event, config: { host?: string; port?: number }) => {
    if (serverStatus.running) {
      return { error: 'Server already running', status: serverStatus }
    }

    try {
      serverInstance = createServer({
        host: config.host,
        port: config.port,
        corsOrigins: ['*'],
        enableUI: true,
      })

      const { url } = await serverInstance.start()
      serverStatus = { running: true, url }

      console.log(`Cloudy server started on ${url}`)
      return { status: serverStatus }
    } catch (error) {
      console.error('Failed to start server:', error)
      return { error: String(error), status: serverStatus }
    }
  })

  ipcMain.handle('server:stop', async () => {
    if (!serverStatus.running || !serverInstance) {
      return { error: 'Server not running', status: serverStatus }
    }

    try {
      await serverInstance.stop()
      serverStatus = { running: false }
      serverInstance = null
      console.log('Cloudy server stopped')
      return { status: serverStatus }
    } catch (error) {
      console.error('Failed to stop server:', error)
      return { error: String(error), status: serverStatus }
    }
  })

  ipcMain.handle('server:status', () => {
    return { status: serverStatus }
  })

  ipcMain.handle('config:load', () => {
    return desktopConfig
  })

  ipcMain.handle('config:save', (_event, newConfig: DesktopConfig) => {
    desktopConfig = newConfig
    saveDesktopConfig(desktopConfig)
    return desktopConfig
  })
}

app.whenReady().then(async () => {
  try {
    desktopConfig = loadDesktopConfig()
    await startServerIfNeeded()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  } catch (err: any) {
    dialog.showErrorBox(
      'Application Error (Uncaught Exception)',
      err.stack || err.message || String(err)
    )
  }

})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})