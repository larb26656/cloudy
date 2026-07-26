import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
  ],
  server: {
    port: 3001,
    proxy: {
      '/service': {
        target: 'http://127.0.0.1:4122',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/service/, '')
      }
    }
  },
  resolve: {
    tsconfigPaths: true
  },
})
