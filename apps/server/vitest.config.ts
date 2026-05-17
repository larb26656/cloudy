import { defineConfig, defineProject } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          exclude: ['**/*.integration.test.ts', 'node_modules/**'],
          name: 'unit',
          setupFiles: ['./test/setup.ts'],
        },
        resolve: {
          alias: {
            '@server': path.resolve(__dirname, './src'),
          },
        },
      }),
      defineProject({
        test: {
          name: 'integration',
          include: ['src/**/*.integration.test.ts'],
          setupFiles: ['./test/setup.ts'],
        },
        resolve: {
          alias: {
            '@server': path.resolve(__dirname, './src'),
          },
        },
      }),
    ],
    globals: true,
    environment: 'node',
  },
})