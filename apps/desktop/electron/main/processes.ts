import { spawn, type ChildProcess } from 'node:child_process'
import treeKill from 'tree-kill'

function withStartupTimeout<T>(
  executor: (
    resolve: (val: T) => void,
    reject: (err: Error) => void,
    clearTimeout: () => void
  ) => void,
  timeoutMs: number,
  timeoutMsg: string
): Promise<T> {
  let timer: NodeJS.Timeout | null = null
  return new Promise((resolve, reject) => {
    const clearAndResolve = (val: T) => { if (timer) clearTimeout(timer); resolve(val) }
    const clearAndReject = (err: Error) => { if (timer) clearTimeout(timer); reject(err) }

    timer = setTimeout(() => reject(new Error(timeoutMsg)), timeoutMs)
    executor(clearAndResolve, clearAndReject, () => { if (timer) clearTimeout(timer) })
  })
}

export interface ProcessState {
  serverReady: boolean
  opencodeReady: boolean
  serverProcess: ChildProcess | null
  opencodeProcess: ChildProcess | null
}

function killProcessTree(proc: ChildProcess | null, callback: () => void): void {
  if (!proc || !proc.pid) {
    callback()
    return
  }
  treeKill(proc.pid, 'SIGTERM', (err) => {
    if (err) {
      try {
        treeKill(proc.pid!, 'SIGKILL', () => callback())
      } catch {
        callback()
      }
    } else {
      callback()
    }
  })
}

export function createProcessManager() {
  const state: ProcessState = {
    serverReady: false,
    opencodeReady: false,
    serverProcess: null,
    opencodeProcess: null,
  }

  async function startServer(): Promise<void> {
    return withStartupTimeout((resolve, reject) => {
      const isWin = process.platform === 'win32'
      let serverOutput = ''

      state.serverProcess = spawn(
        'cloudy',
        ['serve', '--host=127.0.0.1', '--port=5120'],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: isWin,
        }
      )

      state.serverProcess.stdout?.on('data', (data: Buffer) => {
        serverOutput += data.toString()
        process.stdout.write(data)
        if (serverOutput.includes('Starting server on')) {
          state.serverReady = true
          resolve()
        }
      })

      state.serverProcess.stderr?.on('data', (data: Buffer) => {
        process.stderr.write(data)
      })

      state.serverProcess.on('error', reject)
      state.serverProcess.on('exit', (code) => {
        if (code !== 0 && !state.serverReady) {
          reject(new Error(`Server exited with code ${code}`))
        }
      })
    }, 30000, 'Server startup timeout')
  }

  async function startOpencode(): Promise<void> {
    return withStartupTimeout((resolve, reject) => {
      const isWin = process.platform === 'win32'
      let opencodeOutput = ''

      state.opencodeProcess = spawn(
        'opencode',
        ['serve', '--port=5121'],
        {
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: isWin,
        }
      )

      state.opencodeProcess.stdout?.on('data', (data: Buffer) => {
        opencodeOutput += data.toString()
        process.stdout.write(data)
        if (/https?:\/\/.*:5121/.test(opencodeOutput)) {
          state.opencodeReady = true
          resolve()
        }
      })

      state.opencodeProcess.stderr?.on('data', (data: Buffer) => {
        process.stderr.write(data)
      })

      state.opencodeProcess.on('error', reject)
      state.opencodeProcess.on('exit', (code) => {
        if (code !== 0 && !state.opencodeReady) {
          reject(new Error(`OpenCode exited with code ${code}`))
        }
      })
    }, 30000, 'OpenCode startup timeout')
  }

  function killAll(): Promise<void> {
    return new Promise((resolve) => {
      const killServer = (): void => {
        if (state.serverProcess) {
          killProcessTree(state.serverProcess, () => {
            state.serverProcess = null
            killOpencode()
          })
        } else {
          killOpencode()
        }
      }

      const killOpencode = (): void => {
        if (state.opencodeProcess) {
          killProcessTree(state.opencodeProcess, () => {
            state.opencodeProcess = null
            resolve()
          })
        } else {
          resolve()
        }
      }

      killServer()
    })
  }

  async function startAll(): Promise<void> {
    state.serverReady = false
    state.opencodeReady = false
    await Promise.all([startServer(), startOpencode()])
  }

  return {
    startAll,
    killAll,
  }
}
