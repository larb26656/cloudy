import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import path from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['@cloudy/server'] })],
    resolve: {
      alias: {
        '@server': path.resolve(__dirname, '../server/src'),
        '@cloudy/server': path.resolve(__dirname, '../server/src/index.ts')
      }
    },
    build: {
      rollupOptions: {
        external: [/^@libsql\//]
      }
    }
  },
  preload: {
  },
})
