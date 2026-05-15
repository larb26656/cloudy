import { defineConfig } from 'electron-vite'
import path from 'path'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@server': path.resolve(__dirname, '../server/src')
      }
    },
    build: {
      rollupOptions: {
        external: ['@libsql/client']
      }
    }
  },
  preload: {
  },
})
