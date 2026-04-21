/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig(({ mode }) => {
  // เช็คว่า mode คือ electron หรือไม่
  const isElectron = mode === 'electron'

  return {
    base: isElectron ? "./" : "/",
    plugins: [tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    server: {
      port: 3001,
      proxy: {
        '/service': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/service/, '')
        }
      }
    },
    test: {
      include: ['src/**/*.test.ts'],
    },
    // test: {
    //   projects: [{
    //     extends: true,
    //     plugins: [
    //       // The plugin will run tests for the stories defined in your Storybook config
    //       // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
    //       storybookTest({
    //         configDir: path.join(dirname, '.storybook')
    //       })],
    //     test: {
    //       name: 'storybook',
    //       browser: {
    //         enabled: true,
    //         headless: true,
    //         provider: playwright({}),
    //         instances: [{
    //           browser: 'chromium'
    //         }]
    //       },
    //       setupFiles: ['.storybook/vitest.setup.ts']
    //     }
    //   }]
    // }
  }
});
