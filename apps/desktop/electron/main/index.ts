import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { spawn, type ChildProcess } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')

export const VITE_DEV_SERVER_URL = undefined;
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null = null
let serverProcess: ChildProcess | null = null
let serverReady = false

async function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32'
    serverProcess = spawn(
      'bun',
      ['run', 'cloudy', 'serve', '--host=127.0.0.1', '--port=3000'],
      {
        cwd: path.resolve(__dirname, '../../..'),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: isWin,
      }
    )

    serverProcess.stdout?.on('data', (data: Buffer) => {
      const str = data.toString()
      process.stdout.write(str)
      if (str.includes('Starting server on')) {
        serverReady = true
        resolve()
      }
    })

    serverProcess.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(data)
    })

    serverProcess.on('error', reject)
    serverProcess.on('exit', (code) => {
      if (code !== 0 && !serverReady) {
        reject(new Error(`Server exited with code ${code}`))
      }
    })

    setTimeout(() => reject(new Error('Server startup timeout')), 30000)
  })
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC!, 'web-app-manifest-512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {

    console.log(path.join(RENDERER_DIST, 'index.html'));
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
  }
})

app.whenReady().then(async () => {
  try {
    // await startServer()
    createWindow()
  } catch (err) {
    console.error('Failed to start:', err)
    process.exit(1)
  }
})
