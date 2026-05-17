import { defineConfig, defineProject } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          exclude: ['**/*.integration.test.ts'],
          name: 'unit',
          setupFiles: ['./test/setup.ts'],
        }
      }),
      defineProject({

        test: {
          name: 'integration',
          include: ['**/*.integration.test.ts'],
          setupFiles: ['./test/setup.ts'],
        }
      }),
    ],
    include: ['src/**/*.test.ts'],
    globals: true,
    environment: 'node',
  },
})