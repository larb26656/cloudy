import { app, BrowserWindow, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fixPath from 'fix-path'
import { createProcessManager } from './processes.js'

fixPath()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')

export const VITE_DEV_SERVER_URL = undefined
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null = null

function createWindow(): void {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.APP_ROOT!, 'assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.whenReady().then(async () => {
  const processes = createProcessManager()

  try {
    await processes.startAll()
    createWindow()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.stack || err.message : String(err)
    console.error('Failed to start:', err)
    dialog.showErrorBox('Failed to start', errorMessage)
    app.exit(1)
  }

  app.on('window-all-closed', () => {
    processes.killAll().then(() => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
  })

  app.on('before-quit', (e) => {
    e.preventDefault()
    processes.killAll().then(() => {
      app.exit(0)
    })
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})
