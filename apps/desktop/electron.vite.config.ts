import { defineConfig } from 'electron-vite'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@server': path.resolve(__dirname, '../server/src')
      }
    },
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: path.resolve(__dirname, '../../node_modules/@libsql'),
            dest: 'node_modules' // มันจะไปโผล่ใน out/main/node_modules
          }
        ]
      })
    ],
    build: {
      rollupOptions: {
        external: ['@libsql/client']
      }
    }
  },
  preload: {
  },
})
